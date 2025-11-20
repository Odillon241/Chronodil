"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '48px', margin: '0', fontWeight: 'bold', color: '#dc2626' }}>
            Erreur globale
          </h1>
          <h2 style={{ fontSize: '20px', marginTop: '16px', marginBottom: '16px', color: '#666' }}>
            Une erreur inattendue s'est produite
          </h2>
          <p style={{ color: '#888', marginBottom: '24px', maxWidth: '500px', fontSize: '14px' }}>
            {error.message || "Une erreur s'est produite lors du chargement de l'application."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
