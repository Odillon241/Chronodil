import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontSize: {
  			base: '12px',
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			'ou-crimson': {
  				'100': '#c7f0dc',
  				'200': '#8fe5ba',
  				'300': '#5ad99d',
  				'400': '#2d8659',
  				'500': '#1a5a3b',
  				'600': '#0f3d26',
  				'700': '#0a2a1b',
  				'800': '#051810',
  				'900': '#020b06',
  				DEFAULT: '#1a5a3b'
  			},
  			'rusty-red': {
  				'100': '#d0f0e1',
  				'200': '#a2e1c4',
  				'300': '#73d2a6',
  				'400': '#3fa856',
  				'500': '#2d8459',
  				'600': '#1f623f',
  				'700': '#144028',
  				'800': '#0a1e13',
  				'900': '#020806',
  				DEFAULT: '#2d8459'
  			},
  			'bright-pink': {
  				'100': '#d4f0e3',
  				'200': '#a8e1c7',
  				'300': '#7dd3ae',
  				'400': '#3ba060',
  				'500': '#2a8249',
  				'600': '#1e5f34',
  				'700': '#143c23',
  				'800': '#0a1f12',
  				'900': '#020805',
  				DEFAULT: '#2a8249'
  			},
  			'amaranth-pink': {
  				'100': '#d9f1e7',
  				'200': '#b3e3cf',
  				'300': '#8cd5b7',
  				'400': '#4ab075',
  				'500': '#2f8d55',
  				'600': '#21643c',
  				'700': '#163b28',
  				'800': '#0a1f13',
  				'900': '#020805',
  				DEFAULT: '#2f8d55'
  			},
  			'light-cyan': {
  				'100': '#dcf4eb',
  				'200': '#b9e8d6',
  				'300': '#96dcc2',
  				'400': '#54bd97',
  				'500': '#2a9b71',
  				'600': '#1e724f',
  				'700': '#144934',
  				'800': '#0a251a',
  				'900': '#020c07',
  				DEFAULT: '#2a9b71'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out'
		},
		transitionTimingFunction: {
			'bounce-subtle': 'cubic-bezier(0.5, 0.85, 0.25, 1.1)',
			'bounce-strong': 'cubic-bezier(0.5, 0.85, 0.25, 1.8)',
			'smooth-out': 'cubic-bezier(0.16, 1, 0.3, 1)'
		}
	}
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
