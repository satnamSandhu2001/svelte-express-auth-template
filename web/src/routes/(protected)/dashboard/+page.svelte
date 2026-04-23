<script lang="ts">
	let greet = $state('');

	const hour = new Date().getHours();

	if (hour < 12) greet = 'Good Morning!';
	else if (hour < 18) greet = 'Good Afternoon!';
	else greet = 'Good Evening!';
</script>

<div class="min-h-screen">
	<div class="container py-8">
		<div class="mb-6 text-center">
			<h1 class="text-3xl font-bold">Dashboard</h1>
			<p class="mt-2 text-gray-600">
				Hi, {greet}
			</p>
		</div>
	</div>
</div>

<svelte:head>
	<title>Dashboard | Admin Panel</title>
</svelte:head>
