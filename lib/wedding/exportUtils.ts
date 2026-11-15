import type { Guest, WeddingConfig } from '@/lib/wedding/types';

export function exportGuestsToCsv(guests: Guest[], config: WeddingConfig) {
  const headers = [
    'Code Billet',
    'Nom',
    'Prénom',
    'Catégorie',
    'Table',
    'Statut RSVP',
    'Accompagnant (+1)',
    'Nom Accompagnant',
    'Nombre Enfants',
    'Régime Alimentaire',
    'Allergies / Particularités',
    'Lien Invitation Personnel',
    ...config.timelineEvents.map((e) => e.title.replace(/;/g, ',')),
    'Émargé Jour J',
    'Heure d\'émargement',
    'Émargé par',
    'Email',
    'Téléphone',
    'Message pour les mariés'
  ];

  const dietaryLabels: Record<string, string> = {
    classic: 'Classique Gastronomique',
    vegetarian: 'Végétarien Gourmand',
    halal: 'Halal',
    kosher: 'Casher',
    gluten_free: 'Sans Gluten',
    other: 'Autre'
  };

  const rsvpLabels: Record<string, string> = {
    confirmed: 'Confirmé (Présent)',
    declined: 'Ne participe pas',
    pending: 'En attente'
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const rows = guests.map((g) => {
    const personalUrl = g.inviteToken ? `${origin}/inv/${g.inviteToken}` : '';
    return [
      g.qrCodeToken,
      `"${g.lastName.replace(/"/g, '""')}"`,
      `"${g.firstName.replace(/"/g, '""')}"`,
      `"${g.category}"`,
      `"${g.tableNumber.replace(/"/g, '""')}"`,
      `"${rsvpLabels[g.rsvpStatus] || g.rsvpStatus}"`,
      g.plusOneAllowed ? `Couple : ${g.guestRsvp === 'confirmed' ? 'invité présent' : g.guestRsvp === 'declined' ? 'invité absent' : 'invité sans réponse'} / ${g.partnerRsvp === 'confirmed' ? 'conjoint présent' : g.partnerRsvp === 'declined' ? 'conjoint absent' : 'conjoint sans réponse'}` : 'Non',
      `"${(g.plusOneName || '').replace(/"/g, '""')}"`,
      g.childrenCount,
      `"${dietaryLabels[g.dietaryPreference] || g.dietaryPreference}"`,
      `"${(g.allergies || '').replace(/"/g, '""')}"`,
      `"${personalUrl}"`,
      ...config.timelineEvents.map((e) => (g.attendingEvents?.[e.id] ?? true) ? 'Oui' : 'Non'),
      g.isCheckedIn ? 'OUI' : 'NON',
      g.checkedInAt ? new Date(g.checkedInAt).toLocaleString('fr-FR') : '',
      `"${(g.checkedInBy || '').replace(/"/g, '""')}"`,
      `"${(g.email || '').replace(/"/g, '""')}"`,
      `"${(g.phone || '').replace(/"/g, '""')}"`,
      `"${(g.personalNote || '').replace(/"/g, '""')}"`
    ].join(';');
  });

  // UTF-8 BOM so Excel opens it with French accents cleanly
  const csvContent = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `liste_emargement_${config.coupleNames.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printCheckinSheet() {
  window.print();
}
