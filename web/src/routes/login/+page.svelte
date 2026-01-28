<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button, Card, Input, Label, Alert } from 'flowbite-svelte';

	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);

	// Get redirect URL from query params
	let redirectUrl = $derived(page.url.searchParams.get('redirect') || '/dashboard');
  	$effect(() => {
		// Check if we have a valid user and weren't just redirected here
		const fromLogout = page.url.searchParams.has('logout');
		const fromExpired = page.url.searchParams.has('expired');

		if ($userStore.user && !fromLogout && !fromExpired && !$userStore.isLoading) {
			// User is already logged in, redirect to dashboard
			goto(redirectUrl);
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!email || !password) {
			return;
		}

		isSubmitting = true;
		userStore.clearError();

		const success = await userStore.login(email, password);

		isSubmitting = false;

		if (success) {
			goto(redirectUrl);
		}
	}
</script>

<svelte:head>
	<title>Login | Admin Panel</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-md">
		<Card size="xl" class="w-full p-4">
			<div class="mb-6 text-center">
				<h3 class="text-2xl font-bold text-gray-900">Log-in</h3>
				<p class="mt-2 text-sm text-gray-600">To access Admin Panel</p>
			</div>

			{#if $userStore.error}
				<Alert color="red" class="mb-4 font-medium">
					{$userStore.error}
				</Alert>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-6">
				<div>
					<Label for="email" class="mb-2">Email</Label>
					<Input
						type="email"
						id="email"
						placeholder="admin@example.com"
						bind:value={email}
						required
						disabled={isSubmitting}
					/>
				</div>
				<div>
					<Label for="password" class="mb-2">Password</Label>
					<Input
						type="password"
						id="password"
						placeholder="••••••••"
						bind:value={password}
						required
						disabled={isSubmitting}
					/>
				</div>
				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{isSubmitting ? 'logging in...' : 'Log in'}
				</Button>
			</form>
		</Card>
	</div>
</div>
