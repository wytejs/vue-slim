<script>
    // Vue functions
	import { createApp } from 'vue'

    // Stylesheets
	import './main.css'
    import './main.sass'

    // JavaScript
    import './main.js'

    // Import Components
	// Here we import a simple Counter component
    import Counter from './components/Counter.vue'

	createApp({
		data() {
			return {
				message: 'Hello Vue-Slim!'
			}
		},

		components: {
			Counter // To apply a Component to the App, you'll need to pass it as a property
		}
	})
</script>

<head>
	<title>Vue-Slim App</title>
	<meta name="language" content="en">
</head>

<body>
	
	<div class="centered">
		<h1 id="shake">{{ message }}</h1>
		<Counter initialCount="0" />
	</div>

</body>