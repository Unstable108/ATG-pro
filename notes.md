Pages Router
The Pages Router is the original routing system, based on the pages directory.  While still fully supported, it is considered legacy for new projects.

The essential top-level folders and files are:

pages/: The heart of the Pages Router. Every .js, .jsx, .ts, or .tsx file in this directory becomes a route based on its file path.
pages/index.js → Serves the / (home) route.
pages/about.js → Serves the /about route.
pages/blog/post-1.js → Serves the /blog/post-1 route.
pages/blog/[slug].js → Creates a dynamic route for /blog/any-slug.
public/: Stores static assets like images, fonts, and icons. Files here are served from the root URL (e.g., public/logo.png is accessible at /logo.png). 
components/ (Common Practice): A folder for reusable React components (e.g., Header.js, Footer.js). 
styles/ (Common Practice): A folder for CSS or styling files, often containing a globals.css for global styles. 
pages/_app.js: A custom App component used to initialize pages. It's perfect for wrapping all pages with a common layout, state management, or global styles. 
pages/_document.js: A custom Document component used to modify the initial HTML document structure (e.g., adding custom <meta> tags).