import { useState } from 'react';
import { DiscussionEmbed } from 'disqus-react';

export default function DisqusComments({ id, title, path }) {
  // State to track whether the user has clicked to load comments
  const [isLoaded, setIsLoaded] = useState(false);

  // Use your real production URL when live, otherwise fallback to localhost
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'; 
  
  const disqusConfig = {
    url: `${siteUrl}${path}`,
    identifier: id,           // Keeps chapters and main novel pages completely separate
    title: title,             // Sets the thread name inside your admin panel
    language: 'en',
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      {!isLoaded ? (
        // Show this button initially
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-3">Comments are hidden to improve page speed.</p>
          <button 
            onClick={() => setIsLoaded(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded transition-colors shadow-sm"
          >
            Load Comments
          </button>
        </div>
      ) : (
        // Render the actual Disqus iframe only after the button is clicked
        <div className="animate-fade-in">
          <DiscussionEmbed
            shortname="celestialnovels" // Your exact shortname
            config={disqusConfig}
          />
        </div>
      )}
    </div>
  );
}