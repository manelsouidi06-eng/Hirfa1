// =====================================================
// supabase-client.js : UNE SEULE initialisation de Supabase.
// Remplacez les deux valeurs ci-dessous (Project Settings > API Keys).
// La Publishable key est faite pour un site web. N'ajoutez JAMAIS
// la clé "secret" / "service_role" ni le mot de passe de la base ici.
// =====================================================
var SUPABASE_URL = "https://sapskpsbylvlmmymwqrf.supabase.co";
var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BDrtMVxauIY1kSFjEYbuGg_pVybSTQM";

window.SUPABASE_CONFIGURED = SUPABASE_URL.indexOf("VOTRE-PROJET") === -1 &&
                             SUPABASE_PUBLISHABLE_KEY.indexOf("VOTRE-CLE") === -1;
if (window.SUPABASE_CONFIGURED && !window.sbClient) {
  window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
