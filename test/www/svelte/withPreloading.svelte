<script context="module">
	export async function preload({ req, url, user }) {
		var resp = await fetch("/obj.json")
    var json = await resp.json() // {evens: [2,4,6]}
    return {evens: json.evens}
	}
</script>

<script>
export let evens;
</script>

<h1>Evens</h1>
<p>{evens}</p>