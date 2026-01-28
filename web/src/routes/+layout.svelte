<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { userStore } from '$lib/stores/user';
	import ToastContainer from '../lib/components/ToastContainer.svelte';

	let { children } = $props();

	onMount(async () => {
		await userStore.init();
	});
</script>

<svelte:head>
	<title>Admin Panel</title>
</svelte:head>

{@render children()}


<ToastContainer />
