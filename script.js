/* =====================================================
   HIRFA – script.js
   NOTE : prototype local. Le panier est gardé dans le navigateur
   (localStorage). Aucun serveur, aucun paiement réel.
   ===================================================== */

/* ===== 1. Réglages de la boutique (modifiez-les ici) ===== */
var CONFIG = {
  devise: "TND",
  livraison: 8,        // frais de livraison
  seuilGratuit: 150,   // livraison offerte à partir de ce montant
  prefixe: "HIR"       // préfixe des numéros de commande (étape 3)
};
var CLES = { panier: "hirfa_cart" };

/* ===== 2. Menu mobile ===== */
var burger = document.getElementById("burger");
var menu = document.getElementById("menu");
burger.addEventListener("click", function () {
  menu.classList.toggle("ouvert");
});

// Sous-menu des catégories : la flèche l'ouvre sur écran tactile
var deroulant = document.querySelector(".deroulant");
if (deroulant) {
  var fleche = deroulant.querySelector(".fleche");
  fleche.addEventListener("click", function () {
    var ouvert = deroulant.classList.toggle("ouvert");
    fleche.setAttribute("aria-expanded", ouvert);
  });
}

/* ===== 3. Panier : fonctions réutilisables ===== */
// Le panier est un objet : { "id-produit": quantité }
function getCart() {
  try { return JSON.parse(localStorage.getItem(CLES.panier)) || {}; }
  catch (e) { return {}; }
}
function saveCart(cart) {
  localStorage.setItem(CLES.panier, JSON.stringify(cart));
  updateCartCount();
}
function trouverProduit(id) {
  return PRODUITS.find(function (p) { return p.id === id; });
}
function addToCart(id) {
  var cart = getCart();
  cart[id] = (cart[id] || 0) + 1;      // déjà présent : on augmente la quantité
  saveCart(cart);
}
function removeFromCart(id) {
  var cart = getCart();
  delete cart[id];
  saveCart(cart);
}
function changeQty(id, delta) {
  var cart = getCart();
  var q = (cart[id] || 0) + delta;
  if (q <= 0) { delete cart[id]; } else { cart[id] = Math.min(q, 99); }
  saveCart(cart);
}
function updateCartCount() {
  var cart = getCart(), total = 0;
  Object.keys(cart).forEach(function (id) { total += cart[id]; });
  var el = document.getElementById("compteur");
  if (el) { el.textContent = total; }
}
// Calcul des totaux : les prix viennent toujours du catalogue (data.js)
function calculateCartTotal() {
  var cart = getCart(), sousTotal = 0;
  Object.keys(cart).forEach(function (id) {
    var p = trouverProduit(id);
    if (p) { sousTotal += p.prix * cart[id]; }
  });
  var livraison = 0;
  if (sousTotal > 0 && sousTotal < CONFIG.seuilGratuit) { livraison = CONFIG.livraison; }
  return { sousTotal: sousTotal, livraison: livraison, total: sousTotal + livraison };
}
function formatPrix(n) { return n + " " + CONFIG.devise; }

/* ===== 4. Boutons « Ajouter au panier » + petit message ===== */
var message = document.createElement("div");
message.className = "toast";
message.setAttribute("role", "status");
document.body.appendChild(message);
var minuteur;
document.addEventListener("click", function (e) {
  var bouton = e.target.closest(".btn-ajout");
  if (!bouton) { return; }
  addToCart(bouton.dataset.id);
  message.textContent = "Ajouté au panier";
  message.classList.add("visible");
  clearTimeout(minuteur);
  minuteur = setTimeout(function () { message.classList.remove("visible"); }, 1500);
});

/* ===== 5. Page panier ===== */
function afficherPanier() {
  var zone = document.getElementById("panier-contenu");
  if (!zone) { return; }
  var cart = getCart(), ids = Object.keys(cart).filter(trouverProduit);
  if (ids.length === 0) {
    zone.innerHTML = '<p>Votre panier est vide.</p><a class="bouton" href="produits.html">Découvrir nos produits</a>';
    return;
  }
  var lignes = ids.map(function (id) {
    var p = trouverProduit(id), q = cart[id];
    return '<div class="ligne">' +
      '<img src="' + p.image + '" alt="' + p.nom + '">' +
      '<div class="ligne-info"><h3>' + p.nom + '</h3><p>' + p.cat + ' – ' + formatPrix(p.prix) + '</p></div>' +
      '<div class="qte"><button data-act="moins" data-id="' + id + '" aria-label="Diminuer la quantité">-</button>' +
      '<span>' + q + '</span>' +
      '<button data-act="plus" data-id="' + id + '" aria-label="Augmenter la quantité">+</button></div>' +
      '<p class="sous">' + formatPrix(p.prix * q) + '</p>' +
      '<button class="suppr" data-act="suppr" data-id="' + id + '">Supprimer</button></div>';
  }).join("");
  var t = calculateCartTotal();
  var livTxt = t.livraison === 0 ? "Offerte" : formatPrix(t.livraison);
  var reste = CONFIG.seuilGratuit - t.sousTotal;
  var astuce = reste > 0 ? '<p class="note">Plus que ' + formatPrix(reste) + ' pour la livraison offerte.</p>' : "";
  zone.innerHTML = '<div class="lignes">' + lignes + '</div>' +
    '<div class="resume"><h2>Résumé</h2>' +
    '<p><span>Sous-total</span><span>' + formatPrix(t.sousTotal) + '</span></p>' +
    '<p><span>Livraison</span><span>' + livTxt + '</span></p>' +
    '<p class="total"><span>Total</span><span>' + formatPrix(t.total) + '</span></p>' + astuce +
    '<p class="note">Livraison : ' + formatPrix(CONFIG.livraison) + ', offerte dès ' + formatPrix(CONFIG.seuilGratuit) + '.</p>' +
    '<button class="bouton" id="btn-commander">Passer à la commande</button>' +
    '<p id="msg-commande" role="status"></p></div>';
}
var zonePanier = document.getElementById("panier-contenu");
if (zonePanier) {
  zonePanier.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) { return; }
    if (b.dataset.act === "plus") { changeQty(b.dataset.id, 1); afficherPanier(); }
    if (b.dataset.act === "moins") { changeQty(b.dataset.id, -1); afficherPanier(); }
    if (b.dataset.act === "suppr") { removeFromCart(b.dataset.id); afficherPanier(); }
    if (b.id === "btn-commander") { commander(); }
  });
  afficherPanier();
}
updateCartCount();

/* ===== 6. Filtre des produits par catégorie (page produits) ===== */
var boutons = document.querySelectorAll(".filtre");
var cartes = document.querySelectorAll("#liste .carte");
boutons.forEach(function (bouton) {
  bouton.addEventListener("click", function () {
    var cat = bouton.dataset.cat;
    boutons.forEach(function (b) { b.classList.remove("actif"); });
    bouton.classList.add("actif");
    cartes.forEach(function (carte) {
      carte.style.display = (cat === "tous" || carte.dataset.cat === cat) ? "" : "none";
    });
  });
});

/* ===== 7. Formulaire de contact : petite validation ===== */
var formulaire = document.getElementById("formulaire");
if (formulaire) {
  formulaire.addEventListener("submit", function (e) {
    e.preventDefault();
    var retour = document.getElementById("retour");
    var nom = document.getElementById("nom").value.trim();
    var email = document.getElementById("email").value.trim();
    var msg = document.getElementById("message").value.trim();
    if (nom === "" || email.indexOf("@") === -1 || msg === "") {
      retour.textContent = "Veuillez remplir votre nom, un e-mail valide et votre message.";
      retour.className = "erreur";
    } else {
      retour.textContent = "Merci " + nom + " ! Votre message est prêt. (Ce formulaire n'envoie pas encore de message : appelez-nous pour commander.)";
      retour.className = "ok";
      formulaire.reset();
    }
  });
}

/* =====================================================
   8. Comptes (Supabase Auth)
   NOTE : protéger une page avec JavaScript ne sécurise rien.
   La vraie sécurité = les règles RLS dans Supabase.
   ===================================================== */
function msgAuth(texte, type) {
  var el = document.getElementById("msg-auth");
  if (el) { el.textContent = texte; el.className = type || ""; }
}
function retourSur() {   // retour demandé après connexion (liste blanche)
  var r = new URLSearchParams(location.search).get("retour");
  return (r === "checkout.html" || r === "compte.html") ? r : "compte.html";
}
async function commander() {
  var msg = document.getElementById("msg-commande");
  if (!shopOk()) { msg.textContent = "Supabase n'est pas configuré (supabase-client.js)."; return; }
  var user = await shopGetUser();
  if (!user) { location.href = "login.html?retour=checkout.html"; return; }   // le panier est conservé
  msg.textContent = "Connecté. La page de commande arrive à l'étape suivante.";
}
async function majLienCompte() {         // lien « Compte » / « Mon compte » du menu
  var lien = document.getElementById("lien-compte");
  if (!lien || !shopOk()) { return; }
  var user = await shopGetUser();
  lien.textContent = user ? "Mon compte" : "Connexion";
  lien.href = user ? "compte.html" : "login.html";
}
majLienCompte();

var formInscription = document.getElementById("form-inscription");
if (formInscription) {
  formInscription.addEventListener("submit", async function (e) {
    e.preventDefault();
    var v = function (id) { return document.getElementById(id).value.trim(); };
    var p = { prenom: v("prenom"), nom: v("nom"), email: v("email"), password: document.getElementById("mdp").value };
    if (!shopOk()) { return msgAuth("Supabase n'est pas configuré (supabase-client.js).", "erreur"); }
    if (!p.prenom || !p.nom || !p.email || !p.password) { return msgAuth("Veuillez remplir tous les champs.", "erreur"); }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) { return msgAuth("Adresse e-mail invalide.", "erreur"); }
    if (p.password.length < 8) { return msgAuth("Le mot de passe doit contenir au moins 8 caractères.", "erreur"); }
    if (p.password !== document.getElementById("mdp2").value) { return msgAuth("Les mots de passe ne correspondent pas.", "erreur"); }
    if (!document.getElementById("conditions").checked) { return msgAuth("Veuillez accepter les conditions de la démonstration.", "erreur"); }
    var bouton = formInscription.querySelector("button[type=submit]");
    bouton.disabled = true; msgAuth("Création du compte…");
    var r = await shopSignUp(p);
    bouton.disabled = false;
    if (r.error) { return msgAuth(r.error, "erreur"); }
    sessionStorage.setItem("hirfa_pending_email", p.email);   // seulement pour l'affichage
    location.href = "verification.html";
  });
}
var formConnexion = document.getElementById("form-connexion");
if (formConnexion) {
  document.getElementById("oubli").addEventListener("click", function (e) {
    e.preventDefault();
    msgAuth("La récupération de mot de passe n'est pas disponible dans ce prototype.");
  });
  formConnexion.addEventListener("submit", async function (e) {
    e.preventDefault();
    var email = document.getElementById("email").value.trim(), mdp = document.getElementById("mdp").value;
    if (!shopOk()) { return msgAuth("Supabase n'est pas configuré (supabase-client.js).", "erreur"); }
    if (!email || !mdp) { return msgAuth("Entrez votre e-mail et votre mot de passe.", "erreur"); }
    var bouton = formConnexion.querySelector("button[type=submit]");
    bouton.disabled = true; msgAuth("Connexion…");
    var r = await shopSignIn(email, mdp);
    bouton.disabled = false;
    if (r.error) { return msgAuth(r.error, "erreur"); }
    location.href = retourSur();
  });
}
var boutonRenvoi = document.getElementById("renvoyer");
if (boutonRenvoi) {
  var attente = sessionStorage.getItem("hirfa_pending_email");
  if (attente) { document.getElementById("email-attente").textContent = attente; }
  boutonRenvoi.addEventListener("click", async function () {
    if (!shopOk() || !attente) { return msgAuth("Impossible de renvoyer : recommencez l'inscription.", "erreur"); }
    boutonRenvoi.disabled = true;
    var r = await shopResend(attente);
    boutonRenvoi.disabled = false;
    msgAuth(r.error || "Demande d'envoi effectuée. Vérifiez votre boîte mail dans quelques minutes.", r.error ? "erreur" : "ok");
  });
}
var zoneCompte = document.getElementById("compte-contenu");
if (zoneCompte) {
  (async function () {
    if (!shopOk()) { zoneCompte.innerHTML = "<p>Supabase n'est pas configuré (supabase-client.js).</p>"; return; }
    var user = await shopGetUser();
    if (!user) { location.href = "login.html?retour=compte.html"; return; }
    var meta = user.user_metadata || {};
    document.getElementById("titre-compte").textContent = "Bonjour, " + (meta.prenom || "client");
    var verifie = user.email_confirmed_at ? "E-mail confirmé" : "E-mail non confirmé";
    var html = '<h2>Mes informations</h2><ul class="infos"><li>Prénom : ' + esc(meta.prenom || "") + '</li><li>Nom : ' + esc(meta.nom || "") +
      '</li><li>E-mail : ' + esc(user.email) + '</li><li>État : ' + verifie + '</li></ul>' +
      '<h2>Mes commandes</h2><div id="liste-commandes"><p>Chargement…</p></div>' +
      '<p><button class="bouton" id="btn-deconnexion">Se déconnecter</button></p>';
    zoneCompte.innerHTML = html;
    document.getElementById("btn-deconnexion").addEventListener("click", async function () {
      await shopSignOut(); location.href = "index.html";
    });
    var r = await shopMyOrders(), liste = document.getElementById("liste-commandes");
    if (r.error) { liste.innerHTML = '<p class="erreur">' + esc(r.error) + '</p>'; return; }
    if (r.data.length === 0) { liste.innerHTML = "<p>Vous n'avez pas encore de commande.</p>"; return; }
    liste.innerHTML = r.data.map(function (o) {
      var n = (o.items || []).reduce(function (s, i) { return s + i.qty; }, 0);
      return '<div class="commande"><strong>' + esc(o.reference) + '</strong> – ' + new Date(o.created_at).toLocaleDateString("fr-FR") +
        ' – ' + n + ' article(s) – ' + fmtMillimes(o.total_millimes) + ' – ' + esc(STATUTS[o.status] || o.status) + '</div>';
    }).join("") + '<p class="note">Seules vos 100 dernières commandes sont affichées. Paiement simulé.</p>';
  })();
}

/* ===== 9. Page de vérification : arrivée depuis le lien de l'e-mail ===== */
var blocConfirme = document.getElementById("confirme");
if (blocConfirme) {
  (async function () {
    var lienEnErreur = /error=|error_code=/.test(location.hash);   // lien expiré ou déjà utilisé
    var user = await shopGetUser();
    if (user && user.email_confirmed_at) {
      document.getElementById("attente").hidden = true;
      blocConfirme.hidden = false;
    } else if (lienEnErreur) {
      msgAuth("Ce lien est invalide ou a expiré. Cliquez sur « Renvoyer l'e-mail ».", "erreur");
    }
  })();
}
