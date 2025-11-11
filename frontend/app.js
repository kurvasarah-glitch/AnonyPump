// Generate or retrieve a persistent user ID
let userId = localStorage.getItem('anonyPumpUserId');
if (!userId) {
  userId = Math.random().toString(36).substring(2, 14);
  localStorage.setItem('anonyPumpUserId', userId);
}

// Track user votes
let userVotes = JSON.parse(localStorage.getItem('anonyPumpUserVotes')) || {};

// DOM elements
const postsContainer = document.getElementById('posts');
const leaderboardPostsContainer = document.getElementById('leaderboard-posts');

// Pagination variables
const postsLimit = 100;
let currentPage = 0;
const loadMoreButton = document.getElementById('loadMorePosts');

// Bouncing logo animation variables
const bouncingLogos = [];
const MAX_BOUNCING_LOGOS = 10;
const LOGO_SIZE = 50; // pixels, matches CSS
const INITIAL_SPEED_MIN = 8; // Further increased initial speed
const INITIAL_SPEED_MAX = 15; // Further increased initial speed
const SPEED_INCREMENT_PER_BOUNCE = 0.5;
let animationStartTime = Date.now(); // Record animation start time

// Function to create and add a bouncing logo
function createBouncingLogo() {
  if (bouncingLogos.length >= MAX_BOUNCING_LOGOS) return;

  const logo = document.createElement('img');
  logo.src = 'logo1.png';
  logo.classList.add('bouncing-logo');
  document.body.appendChild(logo);

  const initialLeft = Math.random() * (window.innerWidth - LOGO_SIZE);
  const initialTop = Math.random() * (window.innerHeight - LOGO_SIZE);

  logo.style.left = `${initialLeft}px`;
  logo.style.top = `${initialTop}px`;

  let dx = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * (INITIAL_SPEED_MAX - INITIAL_SPEED_MIN) + INITIAL_SPEED_MIN);
  let dy = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * (INITIAL_SPEED_MAX - INITIAL_SPEED_MIN) + INITIAL_SPEED_MIN);

  bouncingLogos.push({
    element: logo,
    x: initialLeft,
    y: initialTop,
    dx: dx,
    dy: dy,
    bounceCount: 0
  });
}

// Animation loop for bouncing logos
function animateBouncingLogos() {
  bouncingLogos.forEach(logoData => {
    logoData.x += logoData.dx;
    logoData.y += logoData.dy;

    let bounced = false;

    // Check for horizontal collisions
    if (logoData.x + LOGO_SIZE > window.innerWidth || logoData.x < 0) {
      logoData.dx *= -1;
      logoData.x = Math.max(0, Math.min(logoData.x, window.innerWidth - LOGO_SIZE)); // Keep within bounds
      bounced = true;
    }

    // Check for vertical collisions
    if (logoData.y + LOGO_SIZE > window.innerHeight || logoData.y < 0) {
      logoData.dy *= -1;
      logoData.y = Math.max(0, Math.min(logoData.y, window.innerHeight - LOGO_SIZE)); // Keep within bounds
      bounced = true;
    }

    if (bounced) {
      logoData.bounceCount++;
      // Only increase speed for the first 20 seconds
      if ((Date.now() - animationStartTime) / 1000 < 20) {
        logoData.dx *= (1 + SPEED_INCREMENT_PER_BOUNCE / 10);
        logoData.dy *= (1 + SPEED_INCREMENT_PER_BOUNCE / 10);
      }

      // Spawn a new logo after a few bounces, up to the max limit
      if (logoData.bounceCount % 3 === 0 && bouncingLogos.length < MAX_BOUNCING_LOGOS) {
        createBouncingLogo();
      }
    }

    logoData.element.style.left = `${logoData.x}px`;
    logoData.element.style.top = `${logoData.y}px`;
  });

  requestAnimationFrame(animateBouncingLogos);
}

// Handle new post submission
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('content').value;
  if (content.trim()) {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, content }),
      });

      if (response.ok) {
        const post = await response.json();
        addPostToDOM(post);
        document.getElementById('content').value = '';
        fetchLeaderboard(); // Update leaderboard when a new post is added
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  }
});

// Function to update vote count in DOM
function updateVoteCount(postId, type) {
  const postElement = document.getElementById(`post-${postId}`);
  if (postElement) {
    const voteElement = postElement.querySelector(`.${type}-count`);
    if (voteElement) {
      voteElement.textContent = (parseInt(voteElement.textContent) || 0) + 1;

      // Add animation class
      voteElement.classList.add('vote-count-animation');
      // Remove animation class after it finishes to allow re-triggering
      voteElement.addEventListener('animationend', () => {
        voteElement.classList.remove('vote-count-animation');
      }, { once: true });

      // Disable voting buttons after a successful vote
      const upvoteButton = postElement.querySelector('.upvote');
      const downvoteButton = postElement.querySelector('.downvote');
      if (upvoteButton) upvoteButton.disabled = true;
      if (downvoteButton) downvoteButton.disabled = true;

      // Store vote in localStorage
      userVotes[postId] = true;
      localStorage.setItem('anonyPumpUserVotes', JSON.stringify(userVotes));
    }
  }
}

// Function to fetch and display top posts for the leaderboard
function fetchLeaderboard() {
  fetch('/api/leaderboard')
    .then(response => response.json())
    .then(topPosts => {
      leaderboardPostsContainer.innerHTML = ''; // Clear previous leaderboard
      topPosts.forEach(post => displayLeaderboardPost(post));
    })
    .catch(error => console.error('Error fetching leaderboard:', error));
}

// Function to display a post in the leaderboard
function displayLeaderboardPost(post) {
  const postElement = document.createElement('div');
  postElement.classList.add('post');
  postElement.innerHTML = `
    <p>${post.content}</p>
    <small>${post.user_id || post.userId} | Upvotes: <span class="leaderboard-upvote-count-highlight">${post.upvotes || 0}</span> | ${new Date(post.timestamp).toLocaleDateString()} ${new Date(post.timestamp).toLocaleTimeString()}</small>
  `;
  leaderboardPostsContainer.append(postElement);
}

// Function to add a post to the DOM (for main feed)
function addPostToDOM(post) {
  // Check if post already exists to avoid duplicates
  if (document.getElementById(`post-${post.id}`)) {
    return;
  }

  const postElement = document.createElement('div');
  postElement.classList.add('post');
  postElement.id = `post-${post.id}`;
  postElement.innerHTML = `
    <p>${post.content}</p>
    <small>${post.user_id || post.userId} | ${new Date(post.timestamp).toLocaleDateString()} ${new Date(post.timestamp).toLocaleTimeString()}</small>
    <div>
      <button class="upvote">Upvote (<span class="upvote-count upvote-count-highlight">${post.upvotes || 0}</span>)</button>
      <button class="downvote">Downvote (<span class="downvote-count downvote-count-highlight">${post.downvotes || 0}</span>)</button>
    </div>
  `;
  postsContainer.prepend(postElement);
  
  // Add new-post-animation class
  postElement.classList.add('new-post-animation');

  // Add event listeners for voting
  const upvoteButton = postElement.querySelector('.upvote');
  const downvoteButton = postElement.querySelector('.downvote');

  upvoteButton.addEventListener('click', async () => {
    if (userVotes[post.id]) {
      alert('You have already voted on this post.');
      return;
    }
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id, type: 'upvote', userId }),
      });

      if (response.ok) {
        const result = await response.json();
        updateVoteCount(post.id, 'upvote');
        fetchLeaderboard(); // Update leaderboard when a vote is updated
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
    }
  });

  downvoteButton.addEventListener('click', async () => {
    if (userVotes[post.id]) {
      alert('You have already voted on this post.');
      return;
    }
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: post.id, type: 'downvote', userId }),
      });

      if (response.ok) {
        const result = await response.json();
        updateVoteCount(post.id, 'downvote');
        fetchLeaderboard(); // Update leaderboard when a vote is updated
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote. Please try again.');
    }
  });

  // Disable buttons if user has already voted
  if (userVotes[post.id]) {
    upvoteButton.disabled = true;
    downvoteButton.disabled = true;
  }
}

// Initial setup
createBouncingLogo(); // Start with one bouncing logo
animateBouncingLogos(); // Start the animation loop

// Initial fetch for both posts and leaderboard
// Modified to support pagination
async function fetchPosts(append = false) {
  const offset = currentPage * postsLimit;
  try {
    const response = await fetch(`/api/posts?limit=${postsLimit}&offset=${offset}`);
    const posts = await response.json();

    if (!append) {
      postsContainer.innerHTML = ''; // Clear for initial load
    }

    posts.forEach(post => addPostToDOM(post));

    if (posts.length < postsLimit) {
      loadMoreButton.style.display = 'none'; // Hide if no more posts
    } else {
      loadMoreButton.style.display = 'block'; // Show if more posts might exist
    }
  } catch (error) {
    console.error('Error fetching initial posts:', error);
  }
}

fetchPosts(); // Initial fetch

loadMoreButton.addEventListener('click', () => {
  currentPage++;
  fetchPosts(true);
});

fetchLeaderboard(); // Initial fetch for leaderboard

// Poll for new posts every 5 seconds (simulates real-time updates)
let lastPostCount = 0;
setInterval(async () => {
  try {
    const response = await fetch(`/api/posts?limit=1&offset=0`);
    const posts = await response.json();
    if (posts.length > 0) {
      const latestPost = posts[0];
      // Check if this is a new post we haven't seen
      if (!document.getElementById(`post-${latestPost.id}`)) {
        addPostToDOM(latestPost);
      }
    }
  } catch (error) {
    console.error('Error polling for new posts:', error);
  }
}, 5000);

// Set interval for leaderboard to update every 10 seconds
setInterval(fetchLeaderboard, 10000);
