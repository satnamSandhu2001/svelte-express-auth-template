<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { Spinner } from 'flowbite-svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	let { children } = $props();

	$effect(() => {
		if (!$userStore.isLoading && !$userStore.user) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>DashBoard | Admin Panel</title>
</svelte:head>

{#if $userStore.isLoading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<Spinner />
			<span class="sr-only">Loading...</span>
		</div>
	</div>
{:else if $userStore.user}
	<Navbar />
	<main class="bg-gray-100">{@render children()}</main>
{/if}
