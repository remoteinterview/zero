function foo(){
	// some client side script to be included in html as <script>
	document.querySelector("h1").innerText = "script works"
}

setTimeout(() => {
	foo()
}, 2000);
