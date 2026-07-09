import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SecurityAPI } from '../api/endpoints';

const STRENGTH_LABELS = ['Très faible', 'Faible', 'Correct', 'Bon', 'Fort', 'Excellent'];
const STRENGTH_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#16a34a'];

export default function ChangePassword() {
  const { user, clearMustChangePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [policy, setPolicy] = useState(null);
  const [strength, setStrength] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { SecurityAPI.passwordPolicy().then(({ data }) => setPolicy(data)).catch(() => {}); }, []);

  useEffect(() => {
    if (!newPassword) { setStrength(0); return; }
    const t = setTimeout(() => {
      SecurityAPI.passwordStrength(newPassword).then(({ data }) => setStrength(data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [newPassword]);

  const bucket = Math.min(5, Math.floor(strength / 20));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setNotice('');
    if (newPassword !== confirmPassword) { setError('La confirmation ne correspond pas au nouveau mot de passe.'); return; }
    setSubmitting(true);
    try {
      await SecurityAPI.changePassword({ currentPassword, newPassword, confirmPassword });
      clearMustChangePassword();
      setNotice('Mot de passe modifié. Redirection…');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || 'Échec du changement de mot de passe.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card" style={{ maxWidth: 440 }}>
        <div className="login-logo"><KeyRound size={28} /></div>
        <h2 className="text-lg font-semibold text-center mb-1">Changement de mot de passe</h2>
        <p className="text-xs text-gray-500 text-center normal-case mb-4">
          {user?.mustChangePassword
            ? "Un changement de mot de passe est requis avant de continuer."
            : 'Modifiez votre mot de passe.'}
        </p>

        {error && <div className="error-banner mb-3">{error}</div>}
        {notice && <div className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded normal-case">{notice}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-group">
            <label>Mot de passe actuel</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Nouveau mot de passe</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            {newPassword && (
              <div className="mt-1">
                <div style={{ height: 6, borderRadius: 3, background: '#e5e7eb', overflow: 'hidden' }}>
                  <div style={{ width: `${strength}%`, height: '100%', background: STRENGTH_COLORS[bucket], transition: 'width .2s' }} />
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: STRENGTH_COLORS[bucket] }}>{STRENGTH_LABELS[bucket]}</div>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Confirmer le nouveau mot de passe</label>
            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          {policy && (
            <div className="text-[11px] text-gray-500 normal-case bg-gray-50 rounded p-2">
              Exigences : {policy.minimumLength}-{policy.maximumLength} caractères
              {policy.requireUppercase && ', une majuscule'}
              {policy.requireLowercase && ', une minuscule'}
              {policy.requireNumber && ', un chiffre'}
              {policy.requireSpecialCharacter && ', un caractère spécial'}.
            </div>
          )}

          <button className="btn btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
          {!user?.mustChangePassword && (
            <button type="button" className="btn btn-outline w-full" onClick={() => navigate('/')}>Annuler</button>
          )}
          <button type="button" className="text-xs text-gray-400 w-full text-center underline" onClick={logout}>Se déconnecter</button>
        </form>
      </div>
    </div>
  );
}
