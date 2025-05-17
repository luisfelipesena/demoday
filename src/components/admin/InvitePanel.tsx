import { useState, useEffect } from "react";

function formatDate(date: string) {
  return new Date(date).toLocaleString('pt-BR');
}

export default function InvitePanel() {
  const [inviteType, setInviteType] = useState<'global' | 'individual'>('global');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState<boolean>(false);

  const fetchInvites = async () => {
    setLoadingInvites(true);
    try {
      const res = await fetch('/api/user/invite');
      const data = await res.json();
      setInvites(data.invites || []);
    } finally {
      setLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleAddEmail = () => {
    if (emailInput && !emails.includes(emailInput)) {
      setEmails((prev) => [...prev, emailInput]);
      setEmailInput("");
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmails((prev) => prev.filter(e => e !== email));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let res;
      if (inviteType === 'global') {
        res = await fetch('/api/user/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'global' }),
        });
      } else {
        res = await fetch('/api/user/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'individual', emails }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar convite');
      setResult(data);
      fetchInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Gerenciar Convites</h2>
      <div className="mb-4 flex gap-4">
        <label>
          <input
            type="radio"
            checked={inviteType === 'global'}
            onChange={() => setInviteType('global')}
          />{' '}
          Gerar código global
        </label>
        <label>
          <input
            type="radio"
            checked={inviteType === 'individual'}
            onChange={() => setInviteType('individual')}
          />{' '}
          Enviar convites individuais
        </label>
      </div>
      {inviteType === 'individual' && (
        <div className="mb-4">
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="Adicionar e-mail"
              className="border rounded px-2 py-1 w-full"
            />
            <button type="button" onClick={handleAddEmail} className="bg-blue-600 text-white px-3 py-1 rounded">Adicionar</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {emails.map((email) => (
              <span key={email} className="bg-gray-200 px-2 py-1 rounded flex items-center">
                {email}
                <button type="button" onClick={() => handleRemoveEmail(email)} className="ml-2 text-red-500">&times;</button>
              </span>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={handleGenerate}
        className="bg-green-600 text-white px-4 py-2 rounded"
        disabled={loading || (inviteType === 'individual' && emails.length === 0)}
      >
        {loading ? 'Gerando...' : inviteType === 'global' ? 'Gerar código global' : 'Enviar convites'}
      </button>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {result && inviteType === 'global' && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <div className="mb-2 font-semibold">Código gerado:</div>
          <div className="mb-2 font-mono break-all">{result.token}</div>
          <div className="mb-2">Link: <a href={result.link} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{result.link}</a></div>
        </div>
      )}
      {result && inviteType === 'individual' && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Convites enviados:</div>
          {Array.isArray(result?.results) && (
            <ul className="space-y-2">
              {result.results.map((r: any) => (
                <li key={r.email} className="bg-gray-100 rounded p-2 flex flex-col md:flex-row md:items-center md:gap-4">
                  <span className="font-mono break-all">{r.email}</span>
                  <span className="font-mono break-all">{r.token}</span>
                  <a href={r.link} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{r.link}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Convites já gerados</h3>
        {loadingInvites ? (
          <div>Carregando convites...</div>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2">Tipo</th>
                <th className="p-2">E-mail</th>
                <th className="p-2">Token</th>
                <th className="p-2">Status</th>
                <th className="p-2">Expira em</th>
                <th className="p-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.token} className="border-t">
                  <td className="p-2">{invite.type}</td>
                  <td className="p-2">{invite.email || <span className="text-gray-400">—</span>}</td>
                  <td className="p-2 font-mono break-all">{invite.token}</td>
                  <td className="p-2">{invite.type === 'global' ? 'Válido' : invite.accepted ? 'Usado' : 'Não usado'}</td>
                  <td className="p-2">{formatDate(invite.expiresAt)}</td>
                  <td className="p-2">
                    <a href={`/register?invite=${invite.token}`} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Link</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 