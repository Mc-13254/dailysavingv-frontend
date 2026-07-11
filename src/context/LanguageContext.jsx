import { createContext, useContext, useState, useEffect } from 'react';

const DICTIONARY = {
  // Sidebar groups
  'Tableau de bord': { en: 'Dashboard' },
  'Executive Dashboard': { en: 'Executive Dashboard' },
  'Changer mon mot de passe': { en: 'Change my password' },
  'Administration': { en: 'Administration' },
  'Paramètres Métier': { en: 'Business Settings' },
  'Gestion des Collecteurs': { en: 'Collector Management' },
  'Gestion des Clients': { en: 'Client Management' },
  'Prêts': { en: 'Loans' },
  'Documents': { en: 'Documents' },
  'Comptabilité': { en: 'Accounting' },
  'Opérations': { en: 'Operations' },
  'Rapports': { en: 'Reports' },
  'Sécurité': { en: 'Security' },
  // Sidebar items
  'IMF': { en: 'IMF' },
  'Agences': { en: 'Agencies' },
  'Utilisateurs': { en: 'Users' },
  'Rôles': { en: 'Roles' },
  'Départements': { en: 'Departments' },
  'Permissions': { en: 'Permissions' },
  'Types de contrat': { en: 'Contract Types' },
  'Types de commission': { en: 'Commission Types' },
  'Tranches de commission': { en: 'Commission Ranges' },
  'Paramètres de numérotation': { en: 'Numbering Parameters' },
  'Collecteurs': { en: 'Collectors' },
  'Affectation des collecteurs': { en: 'Collector Assignment' },
  'Performance des collecteurs': { en: 'Collector Performance' },
  'Clients': { en: 'Clients' },
  'Contrats des clients': { en: 'Client Contracts' },
  'Comptes': { en: 'Accounts' },
  'Loan Management': { en: 'Loan Management' },
  'Document Management': { en: 'Document Management' },
  'Accounting Management': { en: 'Accounting Management' },
  'Session de caisse': { en: 'Cash Session' },
  'Teller Management (Coffre)': { en: 'Teller Management (Vault)' },
  'Collectes journalières': { en: 'Daily Collections' },
  'Dépôts': { en: 'Deposits' },
  'Retraits': { en: 'Withdrawals' },
  'Transferts': { en: 'Transfers' },
  'Validation des opérations': { en: 'Operation Validation' },
  'Report Center': { en: 'Report Center' },
  'Transaction History': { en: 'Transaction History' },
  'Receipts': { en: 'Receipts' },
  'Daily Collection Reports': { en: 'Daily Collection Reports' },
  'Collector Reports': { en: 'Collector Reports' },
  'Client Reports': { en: 'Client Reports' },
  'Account Reports': { en: 'Account Reports' },
  'Contract Reports': { en: 'Contract Reports' },
  'Commission Reports': { en: 'Commission Reports' },
  'Cash Session Reports': { en: 'Cash Session Reports' },
  'Agency Reports': { en: 'Agency Reports' },
  'Financial Reports': { en: 'Financial Reports' },
  'Audit Reports': { en: 'Audit Reports' },
  'Active Sessions': { en: 'Active Sessions' },
  'Fraud Detection': { en: 'Fraud Detection' },
  'Failed Login Attempts': { en: 'Failed Login Attempts' },
  'Audit & Login History': { en: 'Audit & Login History' },
  'Password Policy & API': { en: 'Password Policy & API' },
  'System Health': { en: 'System Health' },
  // Header / common chrome
  'Déconnexion': { en: 'Log out' },
  'Se déconnecter': { en: 'Log out' },
  'Paramètres': { en: 'Settings' },
  'Langue': { en: 'Language' },
  'RÔLE': { en: 'ROLE' },
  'Mode clair': { en: 'Light mode' },
  'Mode sombre': { en: 'Dark mode' },
  'Notifications': { en: 'Notifications' },
  'Session inactive': { en: 'Inactive session' },
  'Prolonger la session': { en: 'Extend session' },
};

const LanguageContext = createContext({ language: 'fr', toggleLanguage: () => {}, t: (s) => s });

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('dsv_lang') || 'fr');

  useEffect(() => {
    localStorage.setItem('dsv_lang', language);
  }, [language]);

  const toggleLanguage = () => setLanguage((l) => (l === 'fr' ? 'en' : 'fr'));

  // Only the chrome (sidebar/header) is translated for now — the dictionary
  // is deliberately small. Full page-by-page translation across every module
  // is a much larger follow-up, not attempted here.
  const t = (text) => {
    if (language === 'fr') return text;
    return DICTIONARY[text]?.en || text;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
