const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
let reservedDomains = new Set();

const fallbackReservedSubdomains = [
	'www', 'mail', 'ftp', 'localhost', 'admin', 'root', 'api', 'cdn', 'ns1', 'ns2',
	'mx', 'smtp', 'pop', 'imap', 'blog', 'forum', 'shop', 'store', 'support',
	'help', 'docs', 'dev', 'test', 'staging', 'beta', 'alpha', 'demo', 'app'
];

const subdomainInput = document.getElementById('subdomainInput');
const checkBtn = document.getElementById('checkBtn');
const result = document.getElementById('result');
const resultText = document.getElementById('resultText');

document.addEventListener('DOMContentLoaded', loadReservedDomains);

async function loadReservedDomains() {
	try {
		const [internalResp, reservedResp] = await Promise.allSettled([
			fetch('https://raw.githubusercontent.com/is-a-dev/register/main/util/internal.json'),
			fetch('https://raw.githubusercontent.com/is-a-dev/register/main/util/reserved.json')
		]);

		let domains = new Set(fallbackReservedSubdomains);

		if (internalResp.status === 'fulfilled' && internalResp.value.ok) {
			const data = await internalResp.value.json();
			if (Array.isArray(data)) data.forEach(d => domains.add(d.toLowerCase()));
		}

		if (reservedResp.status === 'fulfilled' && reservedResp.value.ok) {
			const data = await reservedResp.value.json();
			if (Array.isArray(data)) data.forEach(d => domains.add(d.toLowerCase()));
		}

		reservedDomains = domains;
	} catch (error) {
		console.error('Error loading reserved domains:', error);
		reservedDomains = new Set(fallbackReservedSubdomains);
	}
}

subdomainInput.addEventListener('input', function(e) {
	let value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
	if (value.startsWith('-')) value = value.substring(1);
	if (value.endsWith('-') && value.length > 1) value = value.slice(0, -1);
	e.target.value = value;
});

subdomainInput.addEventListener('keypress', function(e) {
	if (e.key === 'Enter') checkSubdomain();
});

checkBtn.addEventListener('click', checkSubdomain);

async function checkSubdomain() {
	const subdomain = subdomainInput.value.trim().toLowerCase();

	result.className = 'result';
	result.style.display = 'none';

	if (!subdomain) {
		showResult('unavailable', 'Please enter a subdomain name.');
		return;
	}

	if (!subdomainRegex.test(subdomain) || subdomain.length < 1 || subdomain.length > 63) {
		showResult('unavailable', 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens (1-63 characters).');
		return;
	}

	if (reservedDomains.has(subdomain)) {
		showResult('unavailable', '🚫 This subdomain is reserved. Please try a different one.');
		return;
	}

	checkBtn.disabled = true;
	checkBtn.innerHTML = '<span class="loading"></span>Checking...';

	try {
		const response = await fetch(`https://raw.githubusercontent.com/is-a-dev/register/main/domains/${subdomain}.json`);

		if (response.status === 200) {
			showResult('unavailable', `❌ The subdomain "${subdomain}.is-a.dev" is already taken. Try another one!`);
		} else if (response.status === 404) {
			showResult('available', `🎉 "${subdomain}.is-a.dev" is available! <a href="https://docs.is-a.dev/" target="_blank" style="color: inherit; text-decoration: underline;">Register it now</a>`);
		} else {
			throw new Error(`API returned status ${response.status}`);
		}
	} catch (error) {
		showResult('unavailable', 'Error checking availability. Please try again.');
	} finally {
		checkBtn.disabled = false;
		checkBtn.innerHTML = 'Check';
	}
}

function showResult(status, message) {
	result.className = `result ${status}`;
	result.style.display = 'block';
	resultText.innerHTML = message;
}
