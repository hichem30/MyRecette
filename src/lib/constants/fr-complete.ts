/**
 * COMPLETE FRENCH TEXT CONSTANTS
 * 
 * This single file contains ALL UI text for the My Recette application.
 * No more translation files needed - everything is in French.
 * 
 * SCALING SOLUTION:
 * - UI text: Static French in this file
 * - Product names: Database-driven (see /lib/products/service.ts)
 * - No manual "potato", "tomato" entries anywhere
 */

export const FR = {
  // ============================================
  // NAVIGATION
  // ============================================
  nav: {
    home: "Accueil",
    recipes: "Recettes",
    products: "Produits",
    deals: "Promotions",
    bundles: "Lots",
    categories: "Catégories",
    supermarkets: "Supermarchés",
    videos: "Vidéos",
    about: "À propos",
    contact: "Contact",
    search: "Rechercher des produits...",
    searchVideos: "Rechercher des vidéos...",
    cart: "Panier",
    wishlist: "Liste de souhaits",
    login: "Connexion",
    logout: "Déconnexion",
    admin: "Admin",
    account: "Mon Compte",
    myOrders: "Mes Commandes",
    myVideos: "Mes Vidéos",
    language: "Langue"
  },

  // ============================================
  // COMMON TERMS
  // ============================================
  common: {
    new: "NOUVEAU",
    bestSeller: "Meilleure Vente",
    freeShipping: "Livraison Gratuite",
    addToCart: "Ajouter au panier",
    viewProduct: "Voir le produit",
    browseCategory: "Parcourir la catégorie",
    items: "articles",
    products: "produits",
    loading: "Chargement...",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    create: "Créer",
    back: "Retour",
    next: "Suivant",
    prev: "Précédent",
    previous: "Précédent",
    search: "Rechercher",
    filter: "Filtrer",
    sortBy: "Trier par",
    newest: "Le plus récent",
    priceLowHigh: "Prix: du moins cher au plus cher",
    priceHighLow: "Prix: du plus cher au moins cher",
    showing: "Affichage",
    results: "résultats",
    of: "de",
    page: "Page",
    noResults: "Aucun résultat trouvé.",
    yes: "Oui",
    no: "Non",
    submit: "Soumettre",
    submitting: "Envoi en cours...",
    outOfStock: "Rupture de stock",
    inStock: "En stock",
    onlyXLeft: "Il ne reste que {count} en stock",
    you_save: "Vous économisez",
    or: "ou",
    and: "et",
    for: "pour",
    with: "avec",
    all: "Tous les",
    rights: "droits",
    reserved: "réservés",
    followed: "suivis",
    continueShopping: "Continuer vos achats",
    cart: "Panier"
  },

  // ============================================
  // HOME PAGE
  // ============================================
  home: {
    heroBadge: "Plateforme Culinaria — Depuis 2024",
    heroTitle: "Découvrez des Recettes et des Ingrédients Locaux",
    heroSubtitle: "Trouvez des recettes inspirantes et les ingrédients dont vous avez besoin dans les supermarchés locaux, le tout au même endroit.",
    heroCtaRecipes: "Explorer les Recettes",
    heroCtaSupermarkets: "Découvrir les Supermarchés",
    heroCtaShop: "Explorer les Recettes",
    heroCtaContact: "Découvrir les Supermarchés",
    newRecipes: "Nouvelles Recettes",
    newRecipesSubtitle: "Les dernières créations de notre communauté de cuisiniers.",
    newArrivals: "Nouvelles Recettes",
    newArrivalsSubtitle: "Les dernières créations de notre communauté de cuisiniers.",
    trending: "Recettes Populaires",
    trendingSubtitle: "Les recettes les plus aimées et partagées cette semaine.",
    hotDeals: "Recettes Populaires",
    hotDealsSubtitle: "Les recettes les plus aimées et partagées cette semaine.",
    categories: "Catégories de Recettes",
    categoriesSubtitle: "Parcourez par type de cuisine, régime alimentaire ou occasion",
    shopByCategory: "Catégories de Recettes",
    shopByCategorySubtitle: "Parcourez par type de cuisine, régime alimentaire ou occasion",
    featured: "Supermarchés Partenaires",
    featuredSubtitle: "Trouvez les meilleurs supermarchés locaux pour vos ingrédients",
    testimonials: "Ce que disent nos utilisateurs",
    testimonialsSubtitle: "Des milliers de cuisiniers amateur utilisent My Recette pour simplifier leur cuisine.",
    howItWorks: "Comment ça marche",
    step1: "Trouvez des recettes",
    step2: "Vérifiez les ingrédients",
    step3: "Faites vos courses",
    directions: "Commencer",
    visitUs: "Rejoignez Notre Communauté",
    visitUsSubtitle: "Connectez-vous avec des milliers de cuisiniers amateurs partageant des recettes et des conseils.",
    address: "Plateforme en ligne",
    hours: "Disponible 24/7",
    phone: "Support client",
    viewAll: "Voir tout",
    readyTitle: "Prêt à cuisiner en toute confiance ?",
    readyBody: "Rejoignez des milliers de cuisiniers amateurs qui découvrent de nouvelles recettes, soutiennent les supermarchés locaux et rendent les repas plus faciles avec My Recette.",
    readyCtaExplore: "Explorer les Recettes",
    readyCtaJoin: "Rejoignez gratuitement",
    readyCtaShop: "Explorer les Recettes",
    readyCtaContact: "Découvrir les Supermarchés"
  },

  // ============================================
  // PRODUCTS
  // ============================================
  products: {
    title: "Tous les Produits",
    subtitle: "Ingrédients de haute qualité et approvisionnement de cuisine pour toutes vos besoins culinaires.",
    filters: "Filtres",
    allCategories: "Toutes les catégories",
    priceRange: "Fourchette de prix",
    availability: "Disponibilité",
    newArrivalsOnly: "Nouvelles Arrivées Seulement",
    onSaleOnly: "En Promotion Seulement",
    freeShipping: "Livraison Gratuite",
    searchPlaceholder: "Rechercher des produits...",
    noProducts: "Aucun produit ne correspond à vos filtres.",
    all: "Tous les produits",
    related: "Produits apparentés",
    details: "Détails du produit",
    description: "Description",
    specifications: "Spécifications",
    reviews: "Avis",
    rating: "Évaluation",
    outOfStock: "Rupture de stock",
    available: "Disponible",
    sku: "Référence",
    category: "Catégorie"
  },

  // ============================================
  // CATEGORIES
  // ============================================
  categories: {
    title: "Parcourir par Catégorie",
    explore: "EXPLORER",
    subtitle: "Parcourir les catégories de recettes, les cuisines et les préférences alimentaires",
    totalCategories: "Total des catégories",
    productsAvailable: "Produits disponibles",
    always: "Toujours",
    freeShippingMany: "Livraison gratuite sur de nombreux articles"
  },

  // ============================================
  // DEALS / PROMOTIONS
  // ============================================
  deals: {
    title: "Promotions en Vedette",
    subtitle: "Économies à durée limitée — mises à jour quotidiennement.",
    limitedTime: "TEMPS LIMITÉ",
    saveUpTo: "Économisez jusqu'à {percent}% aujourd'hui",
    dealsAvailable: "{count} promotions disponibles",
    updatedDaily: "Mises à jour quotidiennement",
    off: "RÉDUCTION",
    discount: "Réduction de {percent}%"
  },

  // ============================================
  // BUNDLES
  // ============================================
  bundles: {
    title: "Lots",
    subtitle: "Économisez en achetant plusieurs articles ensemble.",
    save: "Économisez",
    viewBundle: "Voir le lot",
    packages: "Lot",
    description: "Plusieurs articles regroupés à un prix réduit."
  },

  // ============================================
  // PROMO CODES
  // ============================================
  promoCodes: {
    title: "Codes Promotionnels",
    subtitle: "Codes promotionnels actifs",
    description: "Copiez un code et collez-le lors du paiement pour des économies instantanées.",
    codes: "Codes",
    activePromoCodes: "Codes Promotionnels Actifs",
    copy: "Copier",
    copied: "Copié!",
    appliesTo: "S'applique à :",
    expires: "Expire",
    code: "Code"
  },

  // ============================================
  // CART
  // ============================================
  cart: {
    title: "Votre Panier",
    empty: "Votre panier est vide.",
    emptyCta: "Parcourir les produits",
    subtotal: "Sous-total",
    shipping: "Livraison",
    tax: "Taxes",
    total: "Total",
    checkout: "Passer à la caisse",
    calculatedAtCheckout: "Calculé à la caisse",
    quantity: "Quantité",
    remove: "Retirer",
    item: "article",
    items: "articles",
    checkoutError: "La caisse n'a pas pu démarrer.",
    checkoutErrorBody: "Veuillez vérifier votre panier et réessayer.",
    updated: "Panier mis à jour",
    continueShopping: "Continuer vos achats"
  },

  // ============================================
  // WISHLIST
  // ============================================
  wishlist: {
    title: "Votre Liste de Souhaits",
    empty: "Vous n'avez pas encore enregistré de produits.",
    emptyCta: "Parcourir les produits",
    remove: "Retirer",
    saveForLater: "Enregistrer pour plus tard",
    added: "Ajouté à la liste de souhaits",
    alreadyInList: "Déjà dans votre liste de souhaits"
  },

  // ============================================
  // CHECKOUT
  // ============================================
  checkout: {
    title: "Caisse",
    success: "Paiement réussi",
    successBody: "Merci pour votre commande — un email de confirmation a été envoyé à {email}.",
    cancel: "Paiement annulé",
    cancelBody: "Votre panier est toujours enregistré. Vous pouvez y retourner à tout moment.",
    shippingInfo: "Informations de livraison",
    paymentInfo: "Informations de paiement",
    reviewOrder: "Revoir la commande",
    placeOrder: "Passer la commande",
    orderSummary: "Récapitulatif de la commande"
  },

  // ============================================
  // LOGIN / AUTHENTICATION
  // ============================================
  login: {
    welcome: "Bienvenue",
    wave: "👋",
    subtitle: "Connectez-vous à votre compte My Recette pour découvrir des recettes et faire vos courses.",
    continueGoogle: "Continuer avec Google",
    continueWith: "Ou continuer avec",
    email: "Adresse e-mail",
    emailPlaceholder: "vous@email.com",
    password: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    rememberMe: "Se souvenir de moi",
    marketingOptin: "Envoyez-moi des emails sur les nouvelles recettes, promotions et conseils de cuisine.",
    signIn: "Se connecter",
    signUp: "Créer un compte",
    noAccount: "Vous n'avez pas de compte ?",
    haveAccount: "Vous avez déjà un compte ?",
    signInWith: "Se connecter avec",
    errorInvalid: "Email ou mot de passe invalide.",
    errorGeneric: "Un problème est survenu — veuillez réessayer.",
    trustedQuality: "Recettes de confiance",
    fastDelivery: "Courses rapides",
    localSupport: "Soutien local réel",
    ranchSupport: "Soutien local réel",
    securePrivate: "Sécurisé et privé",
    createAccount: "Créer un compte",
    alreadyHaveAccount: "Vous avez déjà un compte ?"
  },

  // ============================================
  // FEED
  // ============================================
  feed: {
    title: "Votre Fil d'Actualités",
    subtitle: "Restez informé des derniers produits, coupons et offres des supermarchés que vous suivez.",
    followed: "suivis",
    following: "Abonnements"
  },

  // ============================================
  // ============================================
  // ACCOUNT
  // ============================================
  account: {
    title: "Mon Compte",
    welcome: "Bienvenue",
    profile: "Mon Profil",
    videos: "Mes Vidéos",
    videosSubtitle: "Gérez vos vidéos de recettes téléchargées",
    noVideos: "Vous n'avez pas encore téléchargé de vidéos",
    uploadFirst: "Téléchargez votre première vidéo",
    browseRecipes: "Parcourir les recettes pour ajouter des vidéos",
    viewVideos: "Voir mes vidéos",
    settings: "Paramètres",
    logout: "Se déconnecter",
    favorites: {
      title: "Mes Recettes Favorites",
      subtitle: "Recettes que vous avez enregistrées dans votre liste de favoris.",
      loading: "Chargement…",
      error: "Erreur lors du chargement des favoris",
      empty: "Vous n'avez pas encore enregistré de recettes en favoris.",
      browseRecipes: "Parcourir les recettes",
      favorite: "Favoris",
      favorites: "favoris"
    },
    orders: {
      title: "Mes Commandes",
      subtitle: "Historique de toutes vos commandes passées.",
      loading: "Chargement…",
      error: "Erreur lors du chargement des commandes",
      empty: "Vous n'avez pas encore passé de commande.",
      orderId: "Commande #{id}",
      date: "Date",
      status: "Statut",
      total: "Total",
      viewDetails: "Voir les détails"
    },
    shoppingLists: {
      title: "Mes Listes de Courses",
      subtitle: "Gérez vos listes de courses pour un shopping organisé.",
      loading: "Chargement…",
      error: "Erreur lors du chargement des listes",
      empty: "Vous n'avez pas encore créé de liste de courses.",
      createNew: "Créer une nouvelle liste",
      edit: "Modifier",
      delete: "Supprimer"
    },
    followedSupermarkets: {
      title: "Mes Supermarchés Suivis",
      subtitle: "Supermarchés que vous suivez pour les mises à jour.",
      loading: "Chargement…",
      error: "Erreur lors du chargement des supermarchés",
      empty: "Vous ne suivez aucun supermarché.",
      browseSupermarkets: "Parcourir les supermarchés"
    }
  },

  // ============================================
  // CONTACT
  // ============================================
  contact: {
    title: "Contactez-nous",
    subtitle: "Vous avez une question ? Nous serions ravis de vous entendre. Nous répondons généralement dans un délai d'un jour ouvrable.",
    weAreHere: "Nous sommes là pour vous aider",
    weAreHereBody: "Notre équipe est prête à vous aider pour toute question concernant les recettes, les ingrédients ou l'expérience My Recette.",
    phone: "TÉLÉPHONE",
    email: "ADRESSE EMAIL",
    address: "ADRESSE",
    hoursLabel: "HORAIRES D'OUVERTURE",
    hours: "Lun–Sam · 9h–18h · Fermé le dimanche",
    followUs: "SUIVEZ-NOUS",
    sendMessage: "Envoyez-nous un message",
    yourName: "Votre nom",
    yourEmail: "Adresse email",
    yourMessage: "Message",
    messagePlaceholder: "Dites-nous comment nous pouvons vous aider...",
    send: "Envoyer le message",
    successMessage: "Merci — votre message est en route.",
    errorMessage: "Un problème est survenu — veuillez réessayer ou appelez-nous."
  },

  // ============================================
  // ============================================
  // ABOUT
  // ============================================
  about: {
    title: "Découvrez l'Avenir de la Cuisine",
    subtitle: "My Recette connecte les cuisiniers amateurs aux supermarchés locaux, rendant la découverte de recettes et les courses alimentaires fluides, sociales et intelligentes.",
    yearsStat: "Années d'expertise culinaire",
    recipesStat: "Recettes partagées",
    usersStat: "Cuisiniers connectés",
    supermarketsStat: "Supermarchés locaux",
    story: "NOTRE HISTOIRE",
    storyTitle: "De la cuisine à la communauté",
    storyBody: "My Recette est né d'une idée simple : et si trouver la recette parfaite et les ingrédients pour la réaliser était aussi facile que la cuisson elle-même ? Nous avons créé une plateforme où les cuisiniers amateurs peuvent découvrir de nouvelles recettes, vérifier la disponibilité en temps réel des ingrédients dans les supermarchés à proximité, et acheter tout ce dont ils ont besoin — le tout au même endroit. Plus de recettes abandonnées parce qu'il manque un ingrédient. Plus besoin de faire le tour des magasins. Juste de bons plats, simplifiés.",
    coreValuesLabel: "CE EN QUOI NOUS CROYONS",
    coreValues: "Nos valeurs",
    value1: "Approche axée sur les recettes",
    value1Body: "Nous commençons par des recettes incroyables de vrais cuisiniers, puis nous vous connectons avec les magasins qui ont les ingrédients dont vous avez besoin.",
    value2: "Soutien aux entreprises locales",
    value2Body: "Nous aidons les supermarchés à toucher plus de clients et à vendre plus de produits, tout en vous offrant accès aux meilleures options locales.",
    value3: "Transparence des prix",
    value3Body: "Voyez les vrais prix de plusieurs supermarchés, comparez les options et trouvez les meilleures offres sur des ingrédients de qualité.",
    value4: "Communauté",
    value4Body: "Partagez vos recettes préférées, apprenez des autres cuisiniers et créez des liens à travers la nourriture que nous aimons.",
    value5: "Outils d'achat intelligents",
    value5Body: "Créez des listes de courses à partir des recettes, suivez ce dont vous avez besoin, et obtenez même des recommandations basées sur les produits de saison ou en promotion.",
    value6: "Confidentialité et confiance",
    value6Body: "Vos données vous appartiennent. Nous protégeons vos informations et ne les partageons jamais sans votre permission.",
    howItWorks: "COMMENT ÇA MARCHE",
    step1Title: "Trouvez la recette parfaite",
    step1Body: "Parcourez des milliers de recettes de notre communauté. Filtrez par type de cuisine, besoins alimentaires, temps de cuisson ou ingrédients que vous avez déjà.",
    step2Title: "Vérifiez la disponibilité des ingrédients",
    step2Body: "Voyez quels supermarchés locaux ont les ingrédients dont vous avez besoin, comparez les prix et vérifiez les substituts.",
    step3Title: "Faites vos achats en toute confiance",
    step3Body: "Ajoutez tout à votre panier et passez à la caisse. Retirez en magasin ou faites-vous livrer. C'est aussi simple que ça.",
    readyTitle: "Prêt à cuisiner en toute confiance ?",
    readyBody: "Rejoignez des milliers de cuisiniers amateurs qui découvrent de nouvelles recettes, soutiennent les supermarchés locaux et rendent les repas plus faciles avec My Recette.",
    readyCtaExplore: "Explorer les recettes",
    readyCtaJoin: "Rejoignez gratuitement",
    readyCtaShop: "Explorer les Recettes",
    readyCtaContact: "Découvrir les Supermarchés",
    milestone2020: "Lancement de la plateforme My Recette - 2020",
    milestone2021: "Premières collaborations avec les supermarchés locaux - 2021",
    milestone2022: "Intégration du système de recettes intelligentes - 2022",
    milestone2023: "Expansion à travers la France - 2023",
    milestone2024: "Lancement de la version mobile optimisée - 2024",
    milestoneToday: "Renforcement continu de la communauté culinaire - Aujourd'hui"
  },

  // ============================================
  // SUPERMARKETS
  // ============================================
  supermarkets: {
    title: "Supermarchés",
    subtitle: "Trouvez les meilleurs supermarchés locaux pour vos courses",
    search: "Rechercher des supermarchés...",
    featured: "Supermarchés en vedette",
    nearby: "À proximité",
    all: "Tous les supermarchés",
    noResults: "Aucun supermarché trouvé",
    distance: "Distance",
    km: "km",
    rating: "Évaluation",
    products: "Produits",
    address: "Adresse",
    hours: "Heures d'ouverture"
  },

  // ============================================
  // RECIPES
  // ============================================
  recipes: {
    title: "Recettes",
    subtitle: "Découvrez et partagez des recettes délicieuses de notre communauté de cuisine",
    search: "Rechercher des recettes...",
    searchByIngredients: "Rechercher par ingrédients",
    addIngredient: "Ajouter un ingrédient",
    selectedIngredients: "Ingrédients sélectionnés",
    noIngredientsSelected: "Aucun ingrédient sélectionné",
    findRecipes: "Trouver des recettes",
    clearAll: "Tout effacer",
    noRecipesFound: "Aucune recette trouvée",
    tryDifferent: "Essayez avec des ingrédients différents",
    popularRecipes: "Recettes populaires",
    recentRecipes: "Recettes récentes",
    allRecipes: "Toutes les recettes",
    addRecipe: "Ajouter une recette",
    editRecipe: "Modifier la recette",
    deleteRecipe: "Supprimer la recette",
    recipeDetails: "Détails de la recette",
    ingredients: "Ingrédients",
    instructions: "Instructions",
    servings: "Portions",
    prepTime: "Temps de préparation",
    cookTime: "Temps de cuisson",
    totalTime: "Temps total",
    difficulty: "Difficulté",
    easy: "Facile",
    medium: "Moyenne",
    hard: "Difficile",
    categories: "Catégories",
    tags: "Mots-clés",
    author: "Auteur",
    rating: "Évaluation",
    favorite: "Ajouter aux favoris",
    unfavorite: "Retirer des favoris",
    share: "Partager",
    print: "Imprimer",
    nutrition: "Valeurs nutritionnelles"
  },

  // ============================================
  // VIDEOS
  // ============================================
  videos: {
    title: "Vidéos de Recettes",
    subtitle: "Découvrez des tutoriels de cuisine et des variations de notre communauté",
    description: "Parcourez les vidéos de recettes soumises par les utilisateurs depuis YouTube et Facebook. Regardez, apprenez et partagez vos propres variations culinaires.",
    searchPlaceholder: "Rechercher des vidéos...",
    noResults: "Aucune vidéo trouvée",
    noVideosYet: "Aucune vidéo pour le moment. Soyez le premier à partager votre processus de cuisine !",
    platformFilter: "Filtrer par plateforme",
    allPlatforms: "Toutes les plateformes",
    sortBy: "Trier par",
    videoDetails: "Détails de la vidéo",
    by: "par",
    forRecipe: "pour la recette",
    comments: "Commentaires",
    addComment: "Ajouter un commentaire",
    postComment: "Publier le commentaire",
    noCommentsYet: "Aucun commentaire pour le moment. Soyez le premier à commenter !",
    reactions: "Réactions",
    reactWith: "Réagir avec",
    share: "Partager",
    copyLink: "Copier le lien",
    videoRemoved: "La vidéo a été supprimée",
    backToVideos: "Retour aux vidéos",
    relatedVideos: "Vidéos connexes",
    views: "Vues",
    likes: "J'aime",
    video: "Vidéo",
    upload: "Télécharger une vidéo",
    myVideos: "Mes vidéos"
  },

  // ============================================
  // FOOTER
  // ============================================
  footer: {
    tagline: "Votre plateforme de recettes de confiance connectant les cuisiniers amateurs avec les supermarchés locaux. Découvrez, cuisinez et faites vos courses en toute confiance.",
    quickLinks: "LIENS RAPIDES",
    categoriesHeading: "CATÉGORIES",
    contactUs: "CONTACTEZ-NOUS",
    stayInLoop: "RESTEZ INFORMÉ",
    stayInLoopBody: "Recevez les promotions, les nouveaux arrivages et les offres groupées livrés dans votre boîte de réception.",
    emailPlaceholder: "Votre adresse email",
    subscribe: "S'abonner",
    thanks: "Merci — vous êtes sur la liste.",
    rights: "Tous droits réservés.",
    privacy: "Politique de confidentialité",
    terms: "Conditions d'utilisation",
    madeWith: "Fait avec ❤️ pour la communauté culinaire"
  },

  // ============================================
  // ADMIN
  // ============================================
  admin: {
    dashboard: "Tableau de bord",
    products: "Produits",
    categories: "Catégories",
    messages: "Messages",
    quotes: "Demandes de devis",
    totalProducts: "Total des produits",
    totalOrders: "Total des commandes",
    totalRevenue: "Revenu total",
    unreadMessages: "Messages non lus",
    addProduct: "Ajouter un produit",
    addCategory: "Ajouter une catégorie",
    editProduct: "Modifier le produit",
    editCategory: "Modifier la catégorie",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer cela ?",
    noProducts: "Aucun produit pour le moment — ajoutez votre premier.",
    noCategories: "Aucune catégorie pour le moment.",
    noMessages: "Aucun message pour le moment.",
    noOrders: "Aucune commande pour le moment.",
    noQuotes: "Aucune demande de devis pour le moment.",
    loginTitle: "Connexion Admin",
    loginSubtitle: "Connectez-vous pour gérer la plateforme My Recette.",
    notAuthorized: "Vous n'êtes pas autorisé à accéder à cette page.",
    save: "Enregistrer",
    cancel: "Annuler",
    supabaseNotConfigured: "Supabase non configuré.",
    supabaseConfigInstructions: "Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local (ou votre projet Cloudflare/Vercel) et exécutez les migrations SQL depuis supabase/migrations/. Les nombres en direct apparaîtront ici.",
    revenue: "Revenu",
    orders: "Commandes",
    last30Days: "30 derniers jours",
    productsLabel: "Produits",
    liveInCatalog: "En ligne dans le catalogue",
    customerInbox: "Boîte de réception client",
    recentOrders: "Commandes récentes",
    mostRecentCustomerPurchases: "Achats clients les plus récents.",
    viewAll: "Voir tout",
    recentMessages: "Messages récents",
    customerSupportInbox: "Boîte de réception du support client.",
    quickActions: "Actions rapides",
    addEditRestock: "Ajouter, modifier, réapprovisionner.",
    manageDiscountCodes: "Gérer les codes de réduction.",
    updateShippingStatus: "Mettre à jour le statut d'expédition.",
    inviteTeamMembers: "Inviter des membres de l'équipe.",
    outOfStock: "en rupture de stock",
    promos: "Codes promo",
    staff: "Personnel",
    guestCheckout: "Invité",
    noSubject: "(sans sujet)"
  },

  // ============================================
  // PRIVACY & TERMS
  // ============================================
  privacy: {
    title: "Politique de Confidentialité",
    description: "Découvrez comment nous protégeons vos données et respectons votre vie privée sur My Recette",
    lastUpdated: "Dernière mise à jour :",
    introTitle: "Notre engagement envers votre vie privée",
    introParagraph1: "Chez My Recette, nous prenons votre vie privée au sérieux. Cette politique explique comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre plateforme de découverte de recettes et d'achats.",
    introParagraph2: "En utilisant My Recette, vous acceptez les conditions décrites dans cette politique de confidentialité. Nous vous encourageons à la lire attentivement.",
    contentsTitle: "Table des matières",
    informationTitle: "Informations que nous collectons",
    informationContent: "Nous collectons les informations que vous fournissez directement (telles que votre nom, email et préférences culinaires) ainsi que les informations collectées automatiquement (comme votre adresse IP et comportement de navigation) pour améliorer votre expérience.",
    dataTitle: "Comment nous utilisons vos données",
    dataContent: "Vos données nous aident à personnaliser les recommandations de recettes, vous connecter avec les supermarchés locaux, traiter vos commandes et améliorer notre plateforme. Nous ne vendons jamais vos informations personnelles à des tiers.",
    cookiesTitle: "Cookies et suivi",
    cookiesContent: "Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic du site et comprendre d'où viennent nos visiteurs. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.",
    thirdPartyTitle: "Services tiers",
    thirdPartyContent: "Nous utilisons des services tiers de confiance pour les paiements (Stripe), l'authentification et l'analyse. Ces services ont leurs propres politiques de confidentialité que vous devriez consulter.",
    securityTitle: "Sécurité des données",
    securityContent: "Nous mettons en œuvre des mesures de sécurité standard de l'industrie pour protéger vos données. Toutes les informations de paiement sont cryptées et gérées par notre processeur de paiement, non stockées sur nos serveurs.",
    rightsTitle: "Vos droits",
    rightsContent: "Vous avez le droit d'accéder, de mettre à jour ou de supprimer vos informations personnelles. Vous pouvez également vous désabonner des communications marketing à tout moment.",
    changesTitle: "Modifications de la politique",
    changesContent: "Nous pouvons mettre à jour cette politique de confidentialité de temps en temps. Nous vous informerons de tout changement important par email ou via une notification sur notre plateforme.",
    contactTitle: "Nous contacter concernant la confidentialité",
    contactContent: "Si vous avez des questions ou des préoccupations concernant nos pratiques de confidentialité, veuillez nous contacter à privacy@myrecette.com.",
    supermarketTitle: "Informations pour les supermarchés",
    supermarketContent: "En tant que partenaire supermarché, les informations de votre magasin et les données d'inventaire peuvent être visibles par les utilisateurs. Nous traitons vos données commerciales avec le même soin que les données utilisateurs et ne partageons que ce qui est nécessaire pour que les utilisateurs trouvent et achètent vos produits.",
    questionsTitle: "Vous avez des questions ?",
    questionsContent: "Si vous avez des questions concernant cette politique de confidentialité ou nos pratiques de données, n'hésitez pas à nous contacter.",
    contactUs: "Contactez-nous",
    backToTop: "Retour en haut"
  },

  terms: {
    title: "Conditions d'Utilisation",
    description: "Nos conditions générales pour l'utilisation de My Recette",
    lastUpdated: "Dernière mise à jour : {date}",
    intro: "Bienvenue sur My Recette. En utilisant notre plateforme, vous acceptez ces conditions d'utilisation.",
    userResponsibilities: "Responsabilités de l'utilisateur",
    contentGuidelines: "Lignes directrices du contenu",
    privacyNote: "Votre utilisation de la plateforme est également régie par notre Politique de Confidentialité",
    accountSuspension: "Politique de suspension de compte",
    liability: "Limitation de responsabilité",
    contact: "Pour des questions concernant ces conditions, veuillez nous contacter"
  }
} as const;

export type FRType = typeof FR;

// Type-safe access
export function getText(key: string): string {
  const keys = key.split('.');
  let result: any = FR;
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key; // Return key if not found
    }
  }
  
  return typeof result === 'string' ? result : key;
}

export default FR;