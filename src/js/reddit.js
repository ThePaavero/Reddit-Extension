
/**
 * Reddit extension
 *
 * Misc. functionalities
 * @author Pekka S. <nospam@astudios.org>
 * @license MIT
 */
var Reddit = function() {

	var running;
	var links;
	var link_count = 0;

	/**
	 * Initialize
	 * @return void
	 */
	this.init = function()
	{
		// For thread listings
		tick();

		// For threads
		doMatchUsers();
	};

	/**
	 * Do this on each "tick" (timed due to the nature of RES)
	 * @return void
	 */
	var tick = function()
	{
		links = $('a.title');

		if(links.length === link_count)
		{
			// We've already processed all loaded titles
			return;
		}

		link_count = links.length;

		highlightImageTitles();
		highlightVideoTitles();
		removeElementsWithWhatsThis();
		styleTitleByRankValue();
		doYouTubeHovers();
		autoVote({
				'finland' : 'up',
				'finnish' : 'up',
				'helsinki': 'up',

				'scarlett': 'down',
				'lively'  : 'down',
				'swift'   : 'down'
			});

		console.log('Ticked!');

		running = setInterval(tick, 4000);
	};

	/**
	 * Highlight image titles
	 * @return void
	 */
	var highlightImageTitles = function()
	{
		links.each(function()
		{
			if($(this).data('processed'))
			{
				return true; // Continue
			}

			$(this).data('processed', true);

			var href = $(this).attr('href');
			var par  = $(this).parents('.link');

			if(href.indexOf('.jpg') < 0 && href.indexOf('.png') < 0 && href.indexOf('.gif') < 0)
			{
				$(par).addClass('reddit_title_not_linked_to_image');
			}
			else
			{
				$(this).data('links_to_image', true);
			}
		});
	};

	/**
	 * Highlight video titles
	 * @return void
	 */
	var highlightVideoTitles = function()
	{
		links.each(function()
		{
			if($(this).data('processed_video'))
			{
				return true; // Continue
			}

			$(this).data('processed_video', true);

			var href = $(this).attr('href');
			var par  = $(this).parents('.link');

			if(href.indexOf('youtube.com') > -1 || href.indexOf('youtu.be') > -1)
			{
				$(par).addClass('reddit_title_linked_to_video');
			}
			else
			{
				$(this).data('links_to_video', true);
			}
		});
	};

	/**
	 * Get rid of all elements that have a "what's this?" link
	 * @return void
	 */
	var removeElementsWithWhatsThis = function()
	{
		$('.help-hoverable').each(function()
		{
			var remove_me = $(this).parent();
			remove_me.remove();
		});
	};

	/**
	 * Add class to title element according to amount of upvotes
	 * @return void
	 */
	var styleTitleByRankValue = function()
	{
		var items = $('.thing');
		items.each(function()
		{
			var score_element = $(this).find('.score');
			var score = parseInt(score_element.html(), 10);

			var css_class = 'crap';

			if(score > 1500)
			{
				css_class = 'huge';
			}
			else if(score > 1000)
			{
				css_class = 'big';
			}
			else if(score > 500)
			{
				css_class = 'okay';
			}
			else if(score > 200)
			{
				css_class = 'something';
			}

			$(this).addClass(css_class);
		});
	};

	/**
	 * When hovering over a YouTube thumbnail, create a modal with a YouTube
	 * frame embedded.
	 *
	 * @return void
	 */
	var doYouTubeHovers = function()
	{
		var links = $('a.thumbnail');

		var timer = null;
		window.clearTimeout(timer);
		links.unbind('mouseenter');

		links.each(function()
		{
			if( ! $(this).attr('href'))
			{
				return true; // continue
			}

			var my_href = $(this).attr('href');

			if(my_href.indexOf('youtu') < 0)
			{
				return true; // continue
			}

			$(this).mouseenter(function(e)
			{
				window.clearTimeout(timer);

				$('#reddit_youtube_iframe_wrapper').unbind('mouseenter');
				$('#reddit_youtube_iframe_wrapper').remove();

				var id = parseYouTubeID($(this).attr('href'));

				if(id === false)
				{
					return;
				}

				var markup = '<div id="reddit_youtube_iframe_wrapper"><a href="#" class="closer">×</a><iframe width="560" height="315" src="//www.youtube.com/embed/' + id + '" frameborder="0" allowfullscreen></iframe></div>';
				$('body').prepend(markup);
				$('#reddit_youtube_iframe_wrapper').css({
					top: ($(window).height() / 2) - ($('#reddit_youtube_iframe_wrapper').height() / 2),
					left: ($(window).width() / 2) - ($('#reddit_youtube_iframe_wrapper').width() / 2)
				});

				timer = window.setTimeout(function()
				{
					$('#reddit_youtube_iframe_wrapper').remove();
					console.log('LOL REMOVED');
				}, 4000);

				$('#reddit_youtube_iframe_wrapper').hover(function()
				{
					window.clearTimeout(timer);

					$('#reddit_youtube_iframe_wrapper a.closer').unbind('click');
					$('#reddit_youtube_iframe_wrapper a.closer').click(function()
					{
						$('#reddit_youtube_iframe_wrapper').remove();
						return false;
					});
				});
			});
		});
	};

	/**
	 * Get YouTube ID from URL
	 * @param  {string} url e.g. 'http://www.youtube.com/watch?v=dQw4w9WgXcQ'
	 * @return {string}     e.g. 'dQw4w9WgXcQ'
	 */
	var parseYouTubeID = function(url)
	{
		var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
		var match = url.match(regExp);
		if (match&&match[7].length==11)
		{
			return match[7];
		}
		else
		{
			return false;
		}
	};

	/**
	 * Flash other posts by same user on username hover
	 * @return void
	 */
	var doMatchUsers = function()
	{
		// Gather up our users
		var usernames = $('a.author ');

		// Attach hover listener
		usernames.on('mouseenter', function()
		{
			// Do on hover
			var username = $(this).html();
			var me = $(this);

			// Get other items by this user
			usernames.each(function()
			{
				if($(this).html() === username && $(this) != me)
				{
					// This one's a match
					var apply_to = $(this).parents('.noncollapsed');
					apply_to.addClass('matching_user');
					setTimeout(function()
					{
						apply_to.removeClass('matching_user');
					}, 350);
				}
			});
		});
	};

	/**
	 * Automatically click voting arrows
	 * @param  {object} triggers Trigger as key and "up" or "down" as value
	 * @return void
	 */
	var autoVote = function(triggers)
	{
		links.each(function()
		{
			if($(this).data('processed_down'))
			{
				return true; // Continue
			}

			$(this).data('processed_down', true);

			var title = $(this).html().toLowerCase();

			for(var i in triggers)
			{
				var trigger = i;
				if(title.indexOf(trigger) > -1)
				{
					var type = triggers[i] === 'down' ? 'down' : 'up';
					var vote_link = $(this).parents('.thing ').find('.arrow.' + type);
					vote_link.click();
					console.log(type + 'voted due to trigger "' + trigger + '"');
				}
			}
		});
	};

};

// ---------------------------------------------------------------------------

/**
 * Initiate extension
 * @return void
 */
(function()
{
	var p = new Reddit();
	p.init();
})();

// EOF