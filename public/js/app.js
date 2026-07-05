// OTT App Logic
document.addEventListener("DOMContentLoaded", () => {
    fetchCategoriesAndVideos();
});

async function fetchCategoriesAndVideos() {
    try {
        const categoriesResponse = await fetch('/api/categories');
        const categories = await categoriesResponse.json();
        
        const videosResponse = await fetch('/api/videos');
        const videos = await videosResponse.json();

        renderCategories(categories, videos);
    } catch (error) {
        console.error("Error fetching content:", error);
    }
}

function renderCategories(categories, videos) {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    categories.forEach(category => {
        const catVideos = videos.filter(v => v.category_id === category.id);
        if (catVideos.length === 0) return;

        const row = document.createElement('div');
        row.className = 'category-row';
        
        const title = document.createElement('h2');
        title.className = 'category-title';
        title.innerText = category.name;
        
        const rowContainer = document.createElement('div');
        rowContainer.className = 'row-container';

        catVideos.forEach(video => {
            const card = document.createElement('div');
            card.className = 'card';
            card.tabIndex = 0; // For TV remote / keyboard navigation
            card.style.backgroundImage = `url(${video.banner_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=2069'})`;
            
            card.addEventListener('click', () => {
                openPlayer(video);
            });
            
            card.addEventListener('keydown', (e) => {
                if(e.key === 'Enter') openPlayer(video);
            });

            rowContainer.appendChild(card);
        });

        row.appendChild(title);
        row.appendChild(rowContainer);
        container.appendChild(row);
    });

    // Set Hero to first featured video
    const featured = videos.find(v => v.is_featured) || videos[0];
    if (featured) {
        document.getElementById('hero-title').innerText = featured.title;
        document.getElementById('hero-desc').innerText = featured.description || 'Watch now.';
        document.getElementById('hero').style.backgroundImage = `linear-gradient(to right, rgba(15,16,20,1) 0%, rgba(15,16,20,0) 100%), url(${featured.banner_url})`;
        
        const playBtn = document.getElementById('hero-play');
        playBtn.onclick = () => openPlayer(featured);
    }
}

// Remote Control / Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (document.getElementById('player-screen').classList.contains('active')) return;

    const focusable = Array.from(document.querySelectorAll('.card, .nav-btn, .btn'));
    const index = focusable.indexOf(document.activeElement);

    if (e.key === 'ArrowRight') {
        if (index > -1 && index < focusable.length - 1) focusable[index + 1].focus();
        else focusable[0].focus();
        e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
        if (index > 0) focusable[index - 1].focus();
        e.preventDefault();
    }
});
