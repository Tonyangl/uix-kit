/* 
 *************************************
 * <!-- Ajax Push Content  -->
 *************************************
 */

import {
    templateUrl,
    homeUrl,
    ajaxUrl,
    browser,
    UixModuleInstance,
    UixGUID,
    UixMath,
    UixCssProperty
} from '@uixkit/core/_global/js';
import UixApplyAsyncScripts from '@uixkit/core/_global/js/fn/UixApplyAsyncScripts';


export const AJAX_PUSH_CONTENT = ( ( module, $, window, document ) => {
	if ( window.AJAX_PUSH_CONTENT === null ) return false;
	
	
    module.AJAX_PUSH_CONTENT               = module.AJAX_PUSH_CONTENT || {};
    module.AJAX_PUSH_CONTENT.version       = '0.1.0';
    module.AJAX_PUSH_CONTENT.documentReady = function( $ ) {

        
        //all images from pages
        var sources = []; 
        
		
		/* Need to set it as a global variable for history */
		var ajaxConfig   = {
					"container" :"#my-ajax-demo-push-container",
					"target"    :"#my-ajax-demo-target-container",
					"loading"   :"<div class=\"my-loader\"><span><i class=\"fa fa-spinner fa-spin\"></i> loading <em id=\"app-loading\" data-txt=\"{progress}%\"></em>...</span></div>",
					"method"    :"POST"
				},
			thisPageTitle = document.title;
		
		
		//Click event
		$( document ).off( 'click.AJAX_PUSH_CONTENT' ).on( 'click.AJAX_PUSH_CONTENT', '[data-ajax-push-content]', function( event ) {
			
			event.preventDefault();
			
			
			
			var $this               = $( this ),
			    curURL              = $this.attr( 'href' ),
				config              = $this.data( 'ajax-push-content' );
			

			if ( typeof config == typeof undefined ) {
				config = ajaxConfig;
			}

			
			//The currently URL of link
			if ( typeof curURL === typeof undefined ) {
				curURL = $this.closest( 'a' ).attr( 'href' );
			}


			//Prevent multiple request on click
			if ( $this.data( 'request-running' ) ) {
				return;
			}
			$this.data( 'request-running', true );


	
						
			// Modify the URL without reloading the page
			if( history.pushState ) {
				history.pushState( null, null, curURL );

			} else {
				location.hash = curURL;
			}

			
			//Click on this link element using an AJAX request
			pushAction( $( config.container ), config.target, config.loading, curURL, config.method, $this );


			return false;
			
			
			
		});
		
		

		//Detect URL change & Fire click event
		window.addEventListener( 'popstate', function( e ) {
		
			var eleTarget = null,
				goURL     = location.href;
			
			$( '[data-ajax-push-content]' ).each( function() {
				
				//don't use $( this ).attr( 'href' )
				
				if ( this.href === location.href ) {
					eleTarget = this;
					goURL = this.href;
				}
			});

			
			//Empty content that does not exist
			$( '[data-ajax-push-content]' ).each( function() {
				var curConfig = $( this ).data( 'ajax-push-content' );
				if ( typeof curConfig != typeof undefined ) {
					pushAction( $( curConfig.container ), false, curConfig.loading, goURL, curConfig.method, false );
				}

			});
			
			
			

			
			
			//Push new content to target container
			var backConfig = $( eleTarget ).data( 'ajax-push-content' );
			
			if ( typeof backConfig != typeof undefined ) {
				pushAction( $( backConfig.container ), backConfig.target, backConfig.loading, goURL, backConfig.method, $( eleTarget ) );	
			}
			
			// Output history button
			//console.log(  $( eleTarget ).data( 'ajax-push-content' ) );
			
			
		});
		
		
		

		/*
		 * Move Animation
		 *
		 * @param  {Object} container       - The target container to which the content will be added.
		 * @param  {String|Boolean} target  - The instance ID or class name returned from the callback data. If it is "false", the push content is empty.
		 * @param  {String} loading         - Content of loading area.
		 * @param  {String} url             - The target URL via AJAX. 
		 * @param  {String} method          - The HTTP method to use for the request (e.g. "POST", "GET", "PUT")
		 * @param  {Object|Boolean} btn     - Current trigger button. Avoid button events if "false".
		 * @return {Void}
		 */
		function pushAction( container, target, loading, url, method, btn ) {
			
			
			if ( container.length == 0 ) return false;

			
			if ( typeof method === typeof undefined || method == '' ) {
			    method = 'POST';
			}
		
			
			$.ajax({
				timeout  : 15000,
				url      : url,
				method   : method,
				dataType : 'html',
				data     : {
					action  : 'load_singlepages_ajax_content'
				},
				beforeSend: function() {


					TweenMax.to( container.find( '.ajax-content-loader' ), 0.3, {
						css: {
							opacity    : 1
						},
						ease   : Power2.easeOut
					});		


					container.html( '<div class="ajax-content-loader">'+loading+'</div>' ).promise().done( function() {

						
                        //loading text from HTML
                        $( '#app-loading' ).text( $( '#app-loading' ).data( 'txt' ).replace(/\{progress\}/g, 0) );

						//
						TweenMax.set( container.find( '.ajax-content-loader' ), {
							css         : {
								'display' : 'block'
							},
							onComplete  : function() {
								TweenMax.to( this.target, 0.5, {
									alpha : 1
								});
							}
						});	
					});


				}
            })
            .done( function (response) { 
                //A function to be called if the request succeeds
                var pushContent = ( !target ) ? '' : $( response ).find( target ).html();
                
                
                //Display loading image when AJAX call is in progress
                $( response ).find( 'img' ).each(function() {
                    sources.push(
                        {
                            "url": this.src,
                            "id": 'img-' + UixGUID.create(),
                            "type": 'img'
                        }
                    );
                }); 


                //Execute after all images have loaded
                var per;
                var perInit = 1;
                if ( sources.length == 0 ) {
                    per = 100;
                    
                    //loading text from HTML
                    $( '#app-loading' ).text( $( '#app-loading' ).data( 'txt' ).replace(/\{progress\}/g, per) );
                }
                
                var loadImages = function() {
                    var promises = [];

                    for (var i = 0; i < sources.length; i++) {
                        promises.push(new Promise(function(resolve, reject) {
                            var img = document.createElement("img");
                            img.crossOrigin = "anonymous";
                            img.src = sources[i].url;

                            img.onload = function(image) {
                                return resolve( image ) ;
                            };
                        }).then( textureLoaded ));
                    }

                    return Promise.all(promises);
                };
                
                
                var textureLoaded = function(image) {
                    var imgSrc = image.path[0].currentSrc;
                    

                    //loading
                    per = parseInt( 100 * ( perInit / sources.length ) );

                    console.log( 'progress: ' + per + '%' );

                    if ( isNaN( per ) ) per = 100;  
                    
                    //loading text from HTML
                    $( '#app-loading' ).text( $( '#app-loading' ).data( 'txt' ).replace(/\{progress\}/g, per) );

                    var texture = null;
                    
                    perInit++;
                    return per;
                };


                //images loaded
                //Must be placed behind the loadImages()
                loadImages().then( function( images ) {
                    ajaxSucceeds( container, pushContent, $( response ).filter( 'title' ).text(), btn );
                });
  
                

                

            })
            .fail( function (jqXHR, textStatus, errorThrown) { 
                window.location.href = url;
            });

	
			
		}
		
		
		
		/*
		 * A function to be called if the request succeeds
		 *
		 * @param  {String} container    - The target container to which the content will be added.
		 * @param  {String} content      - The data returned from the server
		 * @param  {String} title        - The title of a requested page.
		 * @param  {Object} btn          - Current trigger button.
		 * @return {Void}
		 */
		function ajaxSucceeds( container, content, title, btn ) {
			
		
			//Remove loader
			TweenMax.to( container.find( '.ajax-content-loader' ), 0.5, {
				alpha       : 0,
				onComplete  : function() {
					TweenMax.set( this.target, {
						css         : {
							'display' : 'none'
						}
					});
					
					//The data returned from the server
					container.html( content ).promise().done( function() {
						
						
						// Apply some asynchronism scripts
						$( document ).UixApplyAsyncScripts();

						
						
						//Change the page title
						if ( title ) {
							document.title = title;
						}
						
						
						
						//Prevent multiple request on click
						if ( btn ) {
							btn.data( 'request-running', false );	
						}
						
						
						
					});
					

				},
				
				
				//Determine the direction of a jQuery scroll event
				//Fix an issue for mousewheel event is too fast.
				delay       : 0.5
			});
			
			
		}

			
		
    };

    module.components.documentReady.push( module.AJAX_PUSH_CONTENT.documentReady );
	

	return class AJAX_PUSH_CONTENT {
		constructor() {
			this.module = module;
		}
		
	};
	
})( UixModuleInstance, jQuery, window, document );

