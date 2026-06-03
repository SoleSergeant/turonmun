import type { Config } from "tailwindcss";

export default {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				'xs': '480px',
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
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// New MUN specific colors - elegant, diplomatic palette
				diplomatic: {
					50: '#eef0f6',
					100: '#d8dce9',
					200: '#b0b8d3',
					300: '#8895bd',
					400: '#5f71a7',
					500: '#3b5091',
					600: '#173873', // Our primary blue color #173873
					700: '#132e5c',
					800: '#0f2446',
					900: '#0a1a30',
					950: '#050f1d',
				},
				// Updated gold palette with #f7a31c as the primary gold color
				gold: {
					50: '#fef9eb',
					100: '#fdf2d6',
					200: '#fbe5ad',
					300: '#fad485',
					400: '#f7a31c', // Our secondary yellow color #f7a31c
					500: '#e68a0c',
					600: '#c26a09',
					700: '#9c4d0c',
					800: '#7e3d10',
					900: '#683410',
					950: '#3c1a06',
				},
				neutral: {
					50: '#f8f9fb',
					100: '#f0f2f6',
					200: '#e3e7ed',
					300: '#cdd5e0',
					400: '#b3bece',
					500: '#99a6bc',
					600: '#818eaa',
					700: '#707e9a',
					800: '#5e6a81',
					900: '#4f586a',
					950: '#2d333e',
				},
			},
			fontFamily: {
				// Simplified font setup for a more professional look
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['Roboto Mono', 'monospace'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0", opacity: "0" },
					to: { height: "var(--radix-accordion-content-height)", opacity: "1" }
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
					to: { height: "0", opacity: "0" }
				},
				"fade-in": {
					"0%": {
						opacity: "0",
						transform: "translateY(10px)"
					},
					"100%": {
						opacity: "1",
						transform: "translateY(0)"
					}
				},
				"fade-out": {
					"0%": {
						opacity: "1",
						transform: "translateY(0)"
					},
					"100%": {
						opacity: "0",
						transform: "translateY(10px)"
					}
				},
				"scale-in": {
					"0%": {
						transform: "scale(0.95)",
						opacity: "0"
					},
					"100%": {
						transform: "scale(1)",
						opacity: "1"
					}
				},
				"slide-in-right": {
					"0%": { transform: "translateX(100%)" },
					"100%": { transform: "translateX(0)" }
				},
				"slide-in-bottom": {
					"0%": { transform: "translateY(100%)" },
					"100%": { transform: "translateY(0)" }
				},
				"page-transition-in": {
					"0%": { 
						opacity: "0",
						transform: "translateY(20px)" 
					},
					"100%": { 
						opacity: "1",
						transform: "translateY(0)" 
					}
				},
				"page-transition-out": {
					"0%": { 
						opacity: "1",
						transform: "translateY(0)" 
					},
					"100%": { 
						opacity: "0",
						transform: "translateY(-20px)" 
					}
				},
				"float": {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-5px)" }
				},
				"globe-rotate": {
					"0%": { transform: "rotate(0deg)" },
					"100%": { transform: "rotate(360deg)" }
				},
				"gradient-x": {
					"0%, 100%": {
						"background-position": "0% 50%"
					},
					"50%": {
						"background-position": "100% 50%"
					}
				},
				"shimmer": {
					"0%": {
						"background-position": "-500px 0"
					},
					"100%": {
						"background-position": "500px 0"
					}
				}
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.3s ease-out",
				"fade-out": "fade-out 0.3s ease-out",
				"scale-in": "scale-in 0.2s ease-out",
				"slide-in-right": "slide-in-right 0.3s ease-out",
				"slide-in-bottom": "slide-in-bottom 0.5s ease-out",
				"page-in": "page-transition-in 0.4s ease-out",
				"page-out": "page-transition-out 0.4s ease-out",
				"float": "float 3s ease-in-out infinite",
				"globe-rotate": "globe-rotate 20s linear infinite",
				"gradient-x": "gradient-x 3s ease infinite",
				"shimmer": "shimmer 1.5s infinite linear"
			},
			backgroundImage: {
				'hero-pattern': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3OTAiIHZpZXdCb3g9IjAgMCAxNDQwIDc5MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIG9wYWNpdHk9IjAuMiI+PHBhdGggZD0iTTE0NDAgMFYxSDBodjc4OWgxNDQwaC0xVjBIMCIgc3Ryb2tlPSJ1cmwoI3BhaW50MF9saW5lYXIpIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNMCAzOTVoMTQ0MCIgc3Ryb2tlPSJ1cmwoI3BhaW50MV9saW5lYXIpIiBzdHJva2Utd2lkdGg9IjEiLz48L2c+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyIiB4MT0iMTQ0MCIgeTE9IjM5NSIgeDI9IjAiIHkyPSIzOTUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjNDk2N0FCIiBzdG9wLW9wYWNpdHk9IjAiLz48c3RvcCBvZmZzZXQ9IjAuNSIgc3RvcC1jb2xvcj0iIzQ5NjdBQiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzQ5NjdBQiIgc3RvcC1vcGFjaXR5PSIwIi8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MV9saW5lYXIiIHgxPSIwIiB5MT0iMzk1LjUiIHgyPSIxNDQwIiB5Mj0iMzk1LjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjMzczRjYxIiBzdG9wLW9wYWNpdHk9IjAiLz48c3RvcCBvZmZzZXQ9IjAuNSIgc3RvcC1jb2xvcj0iIzM3M0Y2MSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzM3M0Y2MSIgc3RvcC1vcGFjaXR5PSIwIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+')",
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'world-map': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3MjAiIHZpZXdCb3g9IjAgMCAxNDQwIDcyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBvcGFjaXR5PSIwLjEiPjxwYXRoIGQ9Ik03ODQuNTEgNzAuNThDODAyLjQ2IDU2Ljg5IDg0OS42NSA0My40NiA4NzIuOTMgNDAuODZDODk2LjIxIDM4LjI2IDk0My40IDQwLjg2IDk2MS4wOSA0MC44NkM5NzguNzkgNDAuODYgMTAyMy40MiA1MS45MSAxMDQxLjEyIDU2LjYzIiBzdHJva2U9InVybCgjcGFpbnQwX2xpbmVhcikiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0yNTIuMTYgNjAxLjMyQzI0MS41MSA2MTcuMjYgMjEzLjg4IDY1Mi45NyAyMDEuNzEgNjYzLjg2QzE4OS41MyA2NzQuNzUgMTQ5LjgyIDcwMi4zNyAxMzIuMTIgNzE1LjM2IiBzdHJva2U9InVybCgjcGFpbnQxX2xpbmVhcikiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik04MjEuODkgNTE0LjhDODI1LjM5IDQ5NS4zMiA4MzguODMgNDU1LjA3IDg1Ni4zNSA0NDUuOTNDODczLjg3IDQzNi44IDkwMi42MSA0NDUuNTQgOTE2LjQ4IDQ0OS45NSIgc3Ryb2tlPSJ1cmwoI3BhaW50Ml9saW5lYXIpIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNOTU1LjQ5IDUyMy4xM0M5NjguOSA1MjAuNjcgOTk5LjI5IDUxNC40NCAxMDA4Ljg5IDUxMS4yOEMxMDE4LjQ5IDUwOC4xMiAxMDM4Ljc2IDUxMC45NCAxMDQ3LjkgNTEzLjM1IiBzdHJva2U9InVybCgjcGFpbnQzX2xpbmVhcikiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik05MDIuNTEgNjA3LjQ1QzkxNC4wNyA2MTEuNzEgOTM3LjYgNjE4LjkxIDkzNy42IDYxNC42NUM5MzcuNiA2MTAuMzkgOTQyLjk5IDU5MS4xMSA5NDUuNjkgNTgyIiBzdHJva2U9InVybCgjcGFpbnQ0X2xpbmVhcikiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik01NTAuMDEgMTIyLjAzQzU0My45MiAxMzQuNDUgNTMwLjU2IDE2MC40OSA1MjcuMjQgMTY4LjE0QzUyMy45MiAxNzUuNzkgNTM2LjA0IDE5Mi4xOCA1NDIuNTggMTk5LjU3IiBzdHJva2U9InVybCgjcGFpbnQ1X2xpbmVhcikiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik01MzAuMTcgMTI0LjE0QzUyNi40MiAxMjQuMTQgNTE0Ljk4IDEyMi44MSA1MDEuOTYgMTE4LjE1QzQ4OC45NCAxMTMuNDkgNDcxLjI1IDExNi4wNCA0NjMuODcgMTE4LjE1IiBzdHJva2U9InVybCgjcGFpbnQ2X2xpbmVhcikiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik02MzcuODggMTExLjkyQzY0Ni4xMiAxMDkuMzMgNjY4LjQxIDEwMi41MyA2OTEuMjkgOTYuMjhDNzE0LjE4IDkwLjA0IDczMy44OSA3Mi41MSA3NDIuMTMgNjQuOTIiIHN0cm9rZT0idXJsKCNwYWludDdfbGluZWFyKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9Ijc4NC41MSIgeTE9IjU1LjMzIiB4Mj0iMTA0MS4xMiIgeTI9IjU1LjMzIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iIzQ5NjdBQiIgc3RvcC1vcGFjaXR5PSIwIi8+PHN0b3Agb2Zmc2V0PSIwLjUiIHN0b3AtY29sb3I9IiM0OTY3QUIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0OTY3QUIiIHN0b3Atb3BhY2l0eT0iMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJwYWludDFfbGluZWFyIiB4MT0iMjUyLjE2IiB5MT0iNjU4LjM0IiB4Mj0iMTMyLjEyIiB5Mj0iNjU4LjM0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iIzQ5NjdBQiIgc3RvcC1vcGFjaXR5PSIwIi8+PHN0b3Agb2Zmc2V0PSIwLjUiIHN0b3AtY29sb3I9IiM0OTY3QUIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0OTY3QUIiIHN0b3Atb3BhY2l0eT0iMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJwYWludDJfbGluZWFyIiB4MT0iODIxLjg5IiB5MT0iNDc5Ljc1IiB4Mj0iOTE2LjQ4IiB5Mj0iNDc5Ljc1IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iIzQ5NjdBQiIgc3RvcC1vcGFjaXR5PSIwIi8+PHN0b3Agb2Zmc2V0PSIwLjUiIHN0b3AtY29sb3I9IiM0OTY3QUIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0OTY3QUIiIHN0b3Atb3BhY2l0eT0iMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJwYWludDNfbGluZWFyIiB4MT0iOTU1LjQ5IiB5MT0iNTE3Ljc5IiB4Mj0iMTA0Ny45IiB5Mj0iNTE3Ljc5IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iIzQ5NjdBQiIgc3RvcC1vcGFjaXR5PSIwIi8+PHN0b3Agb2Zmc2V0PSIwLjUiIHN0b3AtY29sb3I9IiM0OTY3QUIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0OTY3QUIiIHN0b3Atb3BhY2l0eT0iMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJwYWludDRfbGluZWFyIiB4MT0iOTAyLjUxIiB5MT0iNTk0LjcyIiB4Mj0iOTQ1LjY5IiB5Mj0iNTk0LjcyIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agc3RvcC1jb2xvcj0iIzQ5NjdBQiIgc3RvcC1vcGFjaXR5PSIwIi8+PHN0b3Agb2Zmc2V0PSIwLjUiIHN0b3AtY29sb3I9IiM0OTY3QUIiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM0OTY3QUIiIHN0b3Atb3BhY2l0eT0iMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJwYWludDVfbGluZWFyIiB4MT0iNTUwLjAxIiB5MT0iMTYwLjgiIHgyPSI1NDIuNTgiIHkyPSIxNjAuOCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIHN0b3AtY29sb3I9IiM0OTY3QUIiIHN0b3Atb3BhY2l0eT0iMCIvPjxzdG9wIG9mZnNldD0iMC41IiBzdG9wLWNvbG9yPSIjNDk2N0FCIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDk2N0FCIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ2X2xpbmVhciIgeDE9IjUzMC4xNyIgeTE9IjEyMC4yNCIgeDI9IjQ2My44NyIgeTI9IjEyMC4yNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIHN0b3AtY29sb3I9IiM0OTY3QUIiIHN0b3Atb3BhY2l0eT0iMCIvPjxzdG9wIG9mZnNldD0iMC41IiBzdG9wLWNvbG9yPSIjNDk2N0FCIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNDk2N0FCIiBzdG9wLW9wYWNpdHk9IjAiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQ3X2xpbmVhciIgeDE9IjYzNy44OCIgeTE9Ijg4LjQyIiB4Mj0iNzQyLjEzIiB5Mj0iODguNDIiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjNDk2N0FCIiBzdG9wLW9wYWNpdHk9IjAiLz48c3RvcCBvZmZzZXQ9IjAuNSIgc3RvcC1jb2xvcj0iIzQ5NjdBQiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzQ5NjdBQiIgc3RvcC1vcGFjaXR5PSIwIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PC9zdmc+')",
			},
			boxShadow: {
				'smooth': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				'elegant': '0 4px 20px rgba(0, 0, 0, 0.08)',
				'subtle': '0 2px 8px rgba(13, 10, 44, 0.06)',
				'glow': '0 0 15px rgba(79, 102, 155, 0.2)',
				'gold': '0 4px 20px rgba(208, 150, 50, 0.15)',
			},
		}
	},
	plugins: [require("tailwindcss-animate") as any],
} satisfies Config;
