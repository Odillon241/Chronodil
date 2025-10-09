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
  				'100': '#1b0306',
  				'200': '#36050c',
  				'300': '#510811',
  				'400': '#6c0a17',
  				'500': '#880d1e',
  				'600': '#ca132b',
  				'700': '#ed3850',
  				'800': '#f37a8b',
  				'900': '#f9bdc5',
  				DEFAULT: '#880d1e'
  			},
  			'rusty-red': {
  				'100': '#2e070e',
  				'200': '#5b0f1c',
  				'300': '#891629',
  				'400': '#b61e37',
  				'500': '#dd2d4a',
  				'600': '#e4576e',
  				'700': '#ea8192',
  				'800': '#f1abb7',
  				'900': '#f8d5db',
  				DEFAULT: '#dd2d4a'
  			},
  			'bright-pink': {
  				'100': '#400614',
  				'200': '#800b28',
  				'300': '#bf113c',
  				'400': '#ec295a',
  				'500': '#f26a8d',
  				'600': '#f587a2',
  				'700': '#f7a5b9',
  				'800': '#fac3d1',
  				'900': '#fce1e8',
  				DEFAULT: '#f26a8d'
  			},
  			'amaranth-pink': {
  				'100': '#48081e',
  				'200': '#8f103c',
  				'300': '#d7185b',
  				'400': '#ec5288',
  				'500': '#f49cbb',
  				'600': '#f6aec7',
  				'700': '#f8c2d5',
  				'800': '#fbd7e3',
  				'900': '#fdebf1',
  				DEFAULT: '#f49cbb'
  			},
  			'light-cyan': {
  				'100': '#114148',
  				'200': '#228390',
  				'300': '#3abfd1',
  				'400': '#81d6e2',
  				'500': '#cbeef3',
  				'600': '#d4f1f5',
  				'700': '#dff5f7',
  				'800': '#eaf8fa',
  				'900': '#f4fcfc',
  				DEFAULT: '#cbeef3'
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
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
