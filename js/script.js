// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// DOM elements
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');
const randomFactEl = document.getElementById('randomFact');

// Modal elements
const modal = document.getElementById('modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const modalContentEl = document.querySelector('.modal-content');

// Focus / accessibility helpers for modal
let _lastFocusedElement = null;
let _modalKeyListener = null; // function reference so we can remove it

function _trapFocusInModal() {
	const focusable = modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
	const first = focusable[0];
	const last = focusable[focusable.length - 1];

	// Key handler to trap Tab navigation inside modal
	_modalKeyListener = function (e) {
		if (e.key !== 'Tab') return;
		if (!first) {
			e.preventDefault();
			return;
		}
		if (e.shiftKey) {
			// Shift + Tab
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			// Tab
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	};

	document.addEventListener('keydown', _modalKeyListener);
	// Focus the first focusable element for keyboard users
	if (first) first.focus();
}

function _removeFocusTrap() {
	if (_modalKeyListener) {
		document.removeEventListener('keydown', _modalKeyListener);
		_modalKeyListener = null;
	}
}

// Random space facts (LevelUp extra credit)
const spaceFacts = [
	"A day on Venus is longer than a year on Venus.",
	"Neutron stars can spin 600 times per second.",
	"There are more stars in the observable universe than grains of sand on all Earth's beaches.",
	"Jupiter's Great Red Spot is a storm larger than Earth.",
	"Space is not completely empty — it's filled with sparse gas, dust, and energetic particles."
];

// Helper: show a short loading message inside the gallery
function showLoading(message = '🔄 Loading space photos…') {
	gallery.innerHTML = `\n    <div class="placeholder">\n      <div class="placeholder-icon">${message.split(' ')[0]}</div>\n      <p>${message}</p>\n    </div>`;
}

function showPlaceholder() {
	gallery.innerHTML = `\n    <div class="placeholder">\n      <div class="placeholder-icon">🔭</div>\n      <p>Click "Fetch Space Images" to explore the cosmos!</p>\n    </div>`;
}

// Render a random space fact above the gallery
function renderRandomFact() {
	const fact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
	randomFactEl.innerHTML = `<strong>Did you know?</strong> ${fact}`;
}

// Create a gallery item DOM node for an APOD entry
function createGalleryItem(item) {
	const div = document.createElement('article');
	div.className = 'gallery-item';

	const mediaWrapper = document.createElement('div');
	mediaWrapper.className = 'media-wrapper';

	// Handle image or video entries
	if (item.media_type === 'image') {
		const img = document.createElement('img');
		img.src = item.url || item.hdurl || '';
		img.alt = item.title || 'NASA image';
		img.loading = 'lazy';
		mediaWrapper.appendChild(img);
	} else if (item.media_type === 'video') {
		// Prefer thumbnail if available, otherwise fall back to a generic thumbnail
		const thumb = document.createElement('img');
		thumb.src = item.thumbnail_url || `https://img.youtube.com/vi/${extractYouTubeId(item.url)}/hqdefault.jpg`;
		thumb.alt = item.title + ' (video)';
		thumb.loading = 'lazy';
		mediaWrapper.appendChild(thumb);
		const badge = document.createElement('div');
		badge.className = 'video-badge';
		badge.textContent = '▶';
		mediaWrapper.appendChild(badge);
	}

	const caption = document.createElement('div');
	caption.className = 'caption';
	caption.innerHTML = `<h3 class="item-title">${item.title}</h3><p class="item-date">${item.date}</p>`;

	div.appendChild(mediaWrapper);
	div.appendChild(caption);

		// Open modal on click — also set all cards to a uniform color while modal is open
		div.addEventListener('click', () => {
			setUniformCards();
			openModal(item);
		});

	return div;
}

// Extract YouTube ID from an embed or watch URL (best-effort)
function extractYouTubeId(url = '') {
	try {
		const u = new URL(url);
		if (u.hostname.includes('youtube.com')) {
			if (u.pathname.includes('embed')) return u.pathname.split('/').pop();
			return u.searchParams.get('v');
		}
		if (u.hostname === 'youtu.be') return u.pathname.slice(1);
	} catch (e) {
		return '';
	}
	return '';
}

// Render gallery from fetched array
function renderGallery(items) {
	if (!Array.isArray(items) || items.length === 0) {
		gallery.innerHTML = '<div class="placeholder"><p>No images found.</p></div>';
		return;
	}

	gallery.innerHTML = '';
	items.forEach(item => {
		const node = createGalleryItem(item);
		gallery.appendChild(node);
	});
}

// Open modal and populate with the selected item
function openModal(item) {
	modalMedia.innerHTML = '';
	if (item.media_type === 'image') {
		const img = document.createElement('img');
		img.src = item.hdurl || item.url || '';
		img.alt = item.title || 'NASA image';
		modalMedia.appendChild(img);
	} else if (item.media_type === 'video') {
		// If the feed provides an embed url, use iframe; otherwise link to video
		if (item.url && item.url.includes('youtube')) {
			const iframe = document.createElement('iframe');
			iframe.src = item.url;
			iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
			iframe.allowFullscreen = true;
			iframe.setAttribute('frameborder', '0');
			// Wrap iframe in a responsive embed container so it keeps correct aspect ratio
			const embed = document.createElement('div');
			embed.className = 'embed-container';
			embed.appendChild(iframe);
			modalMedia.appendChild(embed);
		} else if (item.thumbnail_url) {
			const img = document.createElement('img');
			img.src = item.thumbnail_url;
			img.alt = item.title + ' (video)';
			modalMedia.appendChild(img);
			const link = document.createElement('a');
			link.href = item.url || '#';
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			link.textContent = 'Open video in a new tab';
			modalMedia.appendChild(link);
		} else {
			const link = document.createElement('a');
			link.href = item.url || '#';
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
			link.textContent = 'View video';
			modalMedia.appendChild(link);
		}
	}

	modalTitle.textContent = item.title || '';
	modalDate.textContent = item.date || '';
	modalExplanation.textContent = item.explanation || '';

	modal.classList.add('open');
	modal.setAttribute('aria-hidden', 'false');

	// Accessibility: remember previously focused element and trap focus inside the modal
	_lastFocusedElement = document.activeElement;
	// Delay trapping to allow DOM to render focusable elements (iframe, links)
	setTimeout(() => _trapFocusInModal(), 50);
		// Prevent background page scrolling while modal is open
		document.body.classList.add('modal-open');
		// Apply night styling to modal so it matches card color
		if (modalContentEl) modalContentEl.classList.add('modal-night');
}

function closeModal() {
	modal.classList.remove('open');
	modal.setAttribute('aria-hidden', 'true');
	// stop video playback by clearing media
	modalMedia.innerHTML = '';

	// Remove focus trap and restore previous focus
	_removeFocusTrap();
		if (_lastFocusedElement && typeof _lastFocusedElement.focus === 'function') {
		_lastFocusedElement.focus();
	}
	_lastFocusedElement = null;
		// Restore page scrolling
		document.body.classList.remove('modal-open');
	// Clear uniform card coloring when modal closes
	clearUniformCards();
		// Remove night styling from modal
		if (modalContentEl) modalContentEl.classList.remove('modal-night');
}

// Make all gallery cards a uniform color (applies a class to the wrapper)
function setUniformCards() {
	const wrapper = document.querySelector('.gallery-wrapper');
	if (wrapper) wrapper.classList.add('uniform');
}

function clearUniformCards() {
	const wrapper = document.querySelector('.gallery-wrapper');
	if (wrapper) wrapper.classList.remove('uniform');
}

// Fetch data from CDN and render
async function fetchAndShow() {
	showLoading();
	try {
		const res = await fetch(apodData);
		if (!res.ok) throw new Error('Network response was not ok');
		const data = await res.json();
		// The CDN returns an array; show newest first
		const sorted = data.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
		renderGallery(sorted);
	} catch (err) {
		gallery.innerHTML = `<div class="placeholder"><p>Error loading images: ${err.message}</p></div>`;
	}
}

// Events
getImageBtn.addEventListener('click', () => fetchAndShow());
modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape') closeModal();
});

// Initialize page with a random fact
renderRandomFact();

// Expose placeholder on load
showPlaceholder();