class Navbar extends HTMLElement {
  connectedCallback() {
    // Inject navbar CSS automatically if not present
    if (!document.getElementById('classmate-navbar-styles')) {
      const style = document.createElement('link');
      style.id = 'classmate-navbar-styles';
      style.rel = 'stylesheet';
      style.href = 'css/navbar.css';
      document.head.appendChild(style);
    }

    // Get attributes for dynamic paths/links
    const homeLink = this.getAttribute('home-link') || 'index.html';

    this.innerHTML = `
      <!-- ══════════════ NAVBAR ══════════════ -->
      <header id="mainHeader">
        <div class="nav-container">
          <!-- Logo -->
          <a href="${homeLink}" class="nav-logo">
            <div class="nav-logo-icon"><i class="fas fa-graduation-cap"></i></div>
            <span>Class<em>Mate</em></span>
          </a>

          <!-- Desktop links -->
          <nav class="nav-links" id="navLinks">
            <a href="${homeLink}" class="nav-link"><i class="fas fa-house"></i> Home</a>
            <a href="aiChatbot.html" class="nav-link"><i class="fas fa-robot"></i> AI ChatBot</a>
            <a href="CgpACal.html" class="nav-link"><i class="fas fa-calculator"></i> CGPA</a>
            <a href="compiler.html" class="nav-link"><i class="fas fa-code"></i> Compiler</a>
            <a href="PreviousQ.html" class="nav-link"><i class="fas fa-book-open"></i> Question Bank</a>
            <a href="admin.html" class="nav-link admin-only" style="display:none;">
              <i class="fas fa-shield-halved"></i> Admin
            </a>
          </nav>

          <!-- Right actions -->
          <div class="nav-actions">
            <!-- For page-specific extra elements like compiler's language selector -->
            <div id="nav-extra-container"></div>
            
            <!-- User dropdown (logged in) / Auth buttons (logged out) -->
            <div class="nav-user" id="userMenu">
              <button class="nav-user-btn" id="userBtn" aria-label="Account" style="display:none">
                <i class="fas fa-user-circle"></i>
                <i class="fas fa-chevron-down nav-chevron"></i>
              </button>
              <div class="nav-dropdown" id="userDropdown">
                <div id="user-dropdown-menu"></div>
              </div>
            </div>

            <!-- Hamburger -->
            <button class="nav-hamburger" id="hamburger" aria-label="Menu">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        <!-- Mobile drawer -->
        <div class="nav-drawer" id="navDrawer">
          <a href="${homeLink}" class="drawer-link"><i class="fas fa-house"></i> Home</a>
          <a href="aiChatbot.html" class="drawer-link"><i class="fas fa-robot"></i> AI ChatBot</a>
          <a href="CgpACal.html" class="drawer-link"><i class="fas fa-calculator"></i> CGPA</a>
          <a href="compiler.html" class="drawer-link"><i class="fas fa-code"></i> Compiler</a>
          <a href="PreviousQ.html" class="drawer-link"><i class="fas fa-book-open"></i> Question Bank</a>
          <a href="admin.html" class="drawer-link admin-only" style="display:none;">
            <i class="fas fa-shield-halved"></i> Admin Dashboard
          </a>
          <div class="drawer-divider"></div>
          <a href="login.html" class="drawer-link"><i class="fas fa-right-to-bracket"></i> Login</a>
          <a href="register.html" class="drawer-link drawer-signup"><i class="fas fa-user-plus"></i> Sign Up</a>
        </div>
      </header>
      <!-- ══════════════ NAVBAR END ══════════════ -->
    `;

    // Move any child templates into their target elements
    const templates = this.querySelectorAll('template');
    templates.forEach(t => {
       const targetId = t.getAttribute('data-target');
       const targetEl = this.querySelector('#' + targetId);
       if (targetEl) {
           targetEl.appendChild(t.content.cloneNode(true));
       }
    });

    this.initNavbarLogic();
  }

  initNavbarLogic() {
    const header = this.querySelector('#mainHeader');
    const hamburger = this.querySelector('#hamburger');
    const navDrawer = this.querySelector('#navDrawer');
    const userBtn = this.querySelector('#userBtn');
    const userDropdown = this.querySelector('#userDropdown');

    // Scroll effect
    window.addEventListener('scroll', () => {
      if (header) {
        header.classList.toggle('scrolled', window.scrollY > 20);
      }
    });

    // Hamburger
    if (hamburger && navDrawer) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        navDrawer.classList.toggle('open');
        document.body.classList.toggle('drawer-open');
      });

      // Close drawer on link click
      navDrawer.querySelectorAll('.drawer-link').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('open');
          navDrawer.classList.remove('open');
          document.body.classList.remove('drawer-open');
        });
      });
    }

    // User dropdown
    if (userBtn && userDropdown) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => {
        if(userDropdown.classList.contains('open')) {
          userDropdown.classList.remove('open');
        }
      });
    }

    // Active link highlighting
    const navLinkEls = this.querySelectorAll('.nav-link');
    navLinkEls.forEach(l => {
      const href = l.getAttribute('href');
      const linkFile = href.split('/').pop().split('?')[0].split('#')[0] || 'index.html';
      const currentFile = location.pathname.split('/').pop() || 'index.html';
      
      if (linkFile === currentFile || (currentFile === 'index.html' && href.startsWith('#'))) {
        if (href.startsWith('#') && href === '#home') l.classList.add('active');
        else if (!href.startsWith('#') && linkFile === currentFile) l.classList.add('active');
      }
    });
  }
}

customElements.define('classmate-navbar', Navbar);
