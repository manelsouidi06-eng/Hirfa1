// =====================================================
// supabase-shop.js : fonctions qui parlent à Supabase (comptes, commandes).
// Prototype : le paiement est SIMULÉ. Aucune donnée bancaire.
// =====================================================
function shopOk() { return !!(window.SUPABASE_CONFIGURED && window.sbClient); }
function shopUrl(page) { return new URL(page, location.href).href; }   // marche en local et sur Vercel
function esc(s) {                                                         // évite d'injecter du HTML
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function fmtMillimes(n) { n = Number(n); return (n % 1000 === 0 ? n / 1000 : (n / 1000).toFixed(3)) + " TND"; }
var STATUTS = { nouvelle: "Nouvelle", en_preparation: "En préparation", terminee: "Terminée", annulee: "Annulée" };

// Messages d'erreur compréhensibles
function shopMessage(err) {
  var m = (err && err.message) || "";
  if (/Invalid login credentials/i.test(m)) return "E-mail ou mot de passe incorrect.";
  if (/Email not confirmed/i.test(m)) return "Votre e-mail n'est pas encore confirmé. Ouvrez le lien reçu par e-mail.";
  if (/already registered/i.test(m)) return "Un compte existe déjà avec cette adresse.";
  if (/rate limit|too many|security purposes/i.test(m)) return "Trop de tentatives. Patientez quelques minutes puis réessayez.";
  if (/password/i.test(m)) return "Mot de passe refusé : utilisez au moins 8 caractères.";
  if (/fetch|network/i.test(m)) return "Problème de connexion internet. Réessayez.";
  return "Une erreur est survenue : " + m;
}

async function shopSignUp(p) {
  var r = await sbClient.auth.signUp({
    email: p.email, password: p.password,
    options: { data: { prenom: p.prenom, nom: p.nom }, emailRedirectTo: shopUrl("verification.html") }
  });
  if (r.error) return { error: shopMessage(r.error) };
  // Supabase renvoie un faux utilisateur sans identité si l'adresse existe déjà
  if (r.data.user && r.data.user.identities && r.data.user.identities.length === 0) {
    return { error: "Un compte existe déjà avec cette adresse." };
  }
  return { ok: true };
}
async function shopSignIn(email, password) {
  var r = await sbClient.auth.signInWithPassword({ email: email, password: password });
  return r.error ? { error: shopMessage(r.error) } : { ok: true };
}
async function shopSignOut() { await sbClient.auth.signOut(); }
async function shopResend(email) {
  var r = await sbClient.auth.resend({ type: "signup", email: email, options: { emailRedirectTo: shopUrl("verification.html") } });
  return r.error ? { error: shopMessage(r.error) } : { ok: true };
}
async function shopGetUser() {          // lit la session enregistrée dans le navigateur
  if (!shopOk()) return null;
  var r = await sbClient.auth.getSession();
  return r.data.session ? r.data.session.user : null;
}
// 100 dernières commandes DU CLIENT CONNECTÉ (les règles RLS filtrent côté base)
async function shopMyOrders() {
  var r = await sbClient.from("orders").select("id,reference,created_at,items,total_millimes,status")
    .order("created_at", { ascending: false }).limit(100);
  return r.error ? { error: shopMessage(r.error) } : { data: r.data };
}
async function shopIsAdmin(userId) {
  var r = await sbClient.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  return !r.error && !!r.data && r.data.role === "admin";
}
