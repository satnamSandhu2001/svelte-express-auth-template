<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Button, Img } from 'flowbite-svelte';
	import { page } from '$app/state';
	import { ArrowLeftToBracketOutline } from 'flowbite-svelte-icons';
	import { fly } from 'svelte/transition';
	import logo from '$lib/assets/logo.png';
	import { toastStore } from '../stores/toastStore';

	let activeUrl = $derived(page.url.pathname);

	async function handleLogout() {
		await userStore.logout();
		toastStore.success('You have been logged out.');
	}

	const urls = [
		{
			name: 'Dashboard',
			url: '/dashboard'
		},
		{
			name: 'Profile',
			url: '/profile'
		}
	];
</script>

<div class="bg-white shadow-2xl">
	<Navbar class="container px-0! py-2" fluid>
		<NavBrand href="/">
			<Img src={logo} alt="Logo" class="mr-3 w-32 md:w-42" />
		</NavBrand>
		<div class="flex md:order-2">
			<Button onclick={handleLogout} size="sm" color="primary"
				>Log out <ArrowLeftToBracketOutline class="ml-1 size-4" /></Button
			>
			<NavHamburger />
		</div>
		<NavUl class="order-1" {activeUrl} transition={fly}>
			{#each urls as url}
				<NavLi
					href={url.url}
					class="text-base {activeUrl === url.url ? 'text-primary-500' : 'text-black'}"
					>{url.name}</NavLi
				>
			{/each}
		</NavUl>
	</Navbar>
</div>
