<script lang="ts">
	import { userStore } from '$lib/stores/user';
	import { Card, Button, Label, Input } from 'flowbite-svelte';
	import { apiUser } from '$lib/service/user';
	import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';

	let old_password = $state('');
	let show_old_password = $state(false);
	let new_password = $state('');
	let show_new_password = $state(false);
	let confirm_password = $state('');
	let show_confirm_password = $state(false);
	let loading = $state(false);

	let message: string | null = $state(null);
	let messageType: 'success' | 'error' = $state('error');

	let errors: Record<string, string> = $state({});

	let disableButton = $derived(
		loading ||
			!old_password ||
			!new_password ||
			!confirm_password ||
			new_password !== confirm_password ||
			Object.keys(errors).length > 0
	);

	function showToast(type: 'success' | 'error', msg: string) {
		messageType = type;
		message = msg;

		setTimeout(() => (message = null), 3000);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();

		errors = {};

		if (!old_password) {
			errors.old_password = 'Old password is required';
		}

		if (!new_password) {
			errors.new_password = 'New password is required';
		}

		if (!confirm_password) {
			errors.confirm_password = 'Confirm password is required';
		}

		if (new_password && confirm_password && new_password !== confirm_password) {
			errors.confirm_password = 'Passwords do not match';
		}

		if (Object.keys(errors).length) return;

		loading = true;

		const res = await apiUser.changePassword({
			old_password,
			new_password
		});

		loading = false;

		if (!res.success) {
			if (res.message) showToast('error', res.message);

			if (res.errors) {
				errors = res.errors;
			}
			return;
		}

		showToast('success', res.message || 'Password updated successfully');

		old_password = '';
		new_password = '';
		confirm_password = '';
	}
</script>

<svelte:head>
	<title>Profile | Admin Panel</title>
</svelte:head>

<div class="min-h-screen">
	<div class="container py-8">
		<div class="mx-auto max-w-2xl">
			<Card size="xl" class="rounded-2xl p-4 sm:p-6">
				<div class="space-y-6">
					<h1 class="mb-8 text-center text-3xl font-bold text-gray-900">Update Password</h1>

					<div class="flex flex-wrap items-center justify-center gap-4 border-b pb-6">
						<div
							class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-600 text-3xl font-bold text-white"
						>
							{$userStore.user?.email?.slice(0, 1)?.toUpperCase()}
						</div>

						<p class="text-gray-600">{$userStore.user?.email}</p>
					</div>

					<form class="space-y-4" onsubmit={handleSubmit}>
						<div>
							<Label for="old_password" class="mb-2">Old Password</Label>
							<Input
								bind:value={old_password}
								type={show_old_password ? 'text' : 'password'}
								id="old_password"
								autocomplete="off"
								class="px-4"
							>
								{#snippet right()}
									<button
										type="button"
										onclick={() => (show_old_password = !show_old_password)}
										class="pointer-events-auto"
									>
										{#if show_old_password}
											<EyeOutline class="h-5 w-5 cursor-pointer" />
										{:else}
											<EyeSlashOutline class="h-5 w-5 cursor-pointer" />
										{/if}
									</button>
								{/snippet}
							</Input>
							{#if errors.old_password}
								<p class="mt-1 text-sm text-red-600">{errors.old_password}</p>
							{/if}
						</div>

						<div>
							<Label for="new_password" class="mb-2">New Password</Label>
							<Input
								bind:value={new_password}
								type={show_new_password ? 'text' : 'password'}
								id="new_password"
								autocomplete="off"
								class="px-4"
							>
								{#snippet right()}
									<button
										type="button"
										onclick={() => (show_new_password = !show_new_password)}
										class="pointer-events-auto"
									>
										{#if show_new_password}
											<EyeOutline class="h-5 w-5 cursor-pointer" />
										{:else}
											<EyeSlashOutline class="h-5 w-5 cursor-pointer" />
										{/if}
									</button>
								{/snippet}
							</Input>
							{#if errors.new_password}
								<p class="mt-1 text-sm text-red-600">{errors.new_password}</p>
							{/if}
						</div>

						<div>
							<Label for="confirm_password" class="mb-2">Confirm Password</Label>
							<Input
								bind:value={confirm_password}
								type={show_confirm_password ? 'text' : 'password'}
								id="confirm_password"
								autocomplete="off"
								class="px-4"
							>
								{#snippet right()}
									<button
										type="button"
										onclick={() => (show_confirm_password = !show_confirm_password)}
										class="pointer-events-auto"
									>
										{#if show_confirm_password}
											<EyeOutline class="h-5 w-5 cursor-pointer" />
										{:else}
											<EyeSlashOutline class="h-5 w-5 cursor-pointer" />
										{/if}
									</button>
								{/snippet}
							</Input>
							{#if errors.confirm_password}
								<p class="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
							{/if}
						</div>

						{#if message}
							<div class="mb-4">
								<p
									class="rounded-md py-2 text-center text-sm {messageType === 'success'
										? 'bg-green-50 text-green-600'
										: 'bg-red-50 text-red-600'}"
								>
									{message}
								</p>
							</div>
						{/if}

						<Button color="primary" type="submit" class="w-full" disabled={disableButton}>
							{loading ? 'Updating...' : 'Update Password'}
						</Button>
					</form>
				</div>
			</Card>
		</div>
	</div>
</div>
