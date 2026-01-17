<script lang="ts">
	import { toastStore } from '$lib/stores/toastStore';
	import { Toast } from 'flowbite-svelte';
	import { CheckCircleSolid, ExclamationCircleSolid, InfoCircleSolid } from 'flowbite-svelte-icons';
	import { fly } from 'svelte/transition';

	const toasts = toastStore;

	function getToastColor(type: string) {
		switch (type) {
			case 'success':
				return 'green';
			case 'error':
				return 'red';
			case 'warning':
				return 'yellow';
			case 'info':
			default:
				return 'blue';
		}
	}
</script>

<div class="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
	{#each $toasts as toast (toast.id)}
		<div transition:fly={{ x: 300, duration: 300 }}>
			<Toast color={getToastColor(toast.type)} onclose={() => toastStore.dismiss(toast.id)}>
				<div class="flex items-center gap-3">
					{#if toast.type === 'success'}
						<CheckCircleSolid class="h-5 w-5 text-green-700" />
					{:else if toast.type === 'error'}
						<ExclamationCircleSolid class="h-5 w-5 text-red-700" />
					{:else if toast.type === 'warning'}
						<ExclamationCircleSolid class="h-5 w-5 text-yellow-700" />
					{:else}
						<InfoCircleSolid class="h-5 w-5 text-blue-700" />
					{/if}
					<span class="font-medium">{toast.message}</span>
				</div>
			</Toast>
		</div>
	{/each}
</div>
