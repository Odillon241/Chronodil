import Link from 'next/link';

export default function NotFound() {
  return (
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
      <h1 style={{ fontSize: '72px', margin: '0', fontWeight: 'bold' }}>404</h1>
      <h2 style={{ fontSize: '24px', marginTop: '16px', marginBottom: '16px' }}>
        Page non trouvée
      </h2>
      <p style={{ color: '#666', marginBottom: '24px', maxWidth: '400px' }}>
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        style={{
          padding: '12px 24px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '16px'
        }}
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
