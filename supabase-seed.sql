-- =====================================================
-- supabase-seed.sql : remet les 10 produits de départ dans la table products.
-- Sans danger : relançable à volonté. Un produit déjà présent n'est pas modifié,
-- et aucun produit n'est supprimé ni dupliqué.
-- Prérequis : supabase-setup.sql déjà exécuté (la table products doit exister).
-- À coller dans Supabase > SQL Editor > Run.
-- =====================================================

insert into public.products (id, name, category, description, price_millimes, image, features, available) values
  ('assiette-poterie', 'Assiette en poterie peinte', 'Poterie et vaisselle', 'Assiette de table ou murale, décor peint à la main.', 35000, 'images/assiette-poterie.jpg', 'Terre cuite émaillée, décor peint à la main, diamètre environ 25 cm, chaque pièce est unique.', true),
  ('tajine-terre-cuite', 'Tajine en terre cuite', 'Poterie et vaisselle', 'Pour cuisiner ou servir, motifs traditionnels.', 70000, 'images/tajine-terre-cuite.jpg', 'Terre cuite, décor traditionnel peint à la main, couvercle conique, diamètre environ 30 cm.', true),
  ('couffin-tresse', 'Couffin tressé', 'Vannerie et tressage', 'Panier souple à anses, pour les courses ou le rangement.', 50000, 'images/couffin-tresse.jpg', 'Fibres naturelles, tressé à la main, deux anses, léger et résistant.', true),
  ('corbeille-jonc', 'Corbeille en jonc tressé', 'Vannerie et tressage', 'Corbeille décorative ou de rangement, tressée à la main.', 40000, 'images/corbeille-jonc.jpg', 'Jonc naturel, tressé à la main, diamètre environ 30 cm.', true),
  ('casserole-cuivre', 'Casserole en cuivre', 'Cuivre et cuisine', 'Ustensile de cuisine traditionnel en cuivre.', 110000, 'images/casserole-cuivre.jpg', 'Cuivre martelé, poignée solide, diamètre environ 18 cm.', true),
  ('plateau-cuivre', 'Plateau en cuivre ciselé', 'Cuivre et cuisine', 'Pour le thé ou la décoration, gravé à la main.', 95000, 'images/plateau-cuivre.jpg', 'Cuivre gravé à la main, diamètre environ 35 cm.', true),
  ('planche-bois', 'Planche à découper en bois', 'Bois', 'Bois naturel, pour couper et servir.', 45000, 'images/planche-bois.jpg', 'Bois naturel façonné à la main, longueur environ 35 cm, lavage à la main conseillé.', true),
  ('plat-bois', 'Verre ou plat en bois', 'Bois', 'Pièce de table façonnée dans le bois.', 30000, 'images/plat-bois.jpg', 'Bois massif façonné à la main, chaque pièce est unique, lavage à la main conseillé.', true),
  ('jarre-huile', 'Jarre d''huile d''olive traditionnelle', 'Produits traditionnels', 'Huile d''olive en jarre artisanale.', 40000, 'images/jarre-huile.jpg', 'Huile d''olive tunisienne, jarre artisanale, contenance environ 1 litre.', true),
  ('bougies', 'Bougies artisanales', 'Produits traditionnels', 'Bougies faites à la main, parfumées.', 20000, 'images/bougies.jpg', 'Cire, fabrication artisanale, plusieurs parfums possibles.', true)
on conflict (id) do nothing;   -- ne modifie pas un produit déjà présent
