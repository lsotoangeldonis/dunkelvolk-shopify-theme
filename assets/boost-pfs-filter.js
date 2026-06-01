// Override Settings
var boostPFSFilterConfig = {
  general: {
    limit: boostPFSThemeConfig.custom.products_per_page,
    // Optional
    loadProductFirst: true,
    styleScrollToTop: 'style2',
    defaultDisplay: boostPFSThemeConfig.custom.layout,
    showPlaceholderProductList: true
  },
};

(function() {
  BoostPFS.inject(this);
  
  ProductGridItem.prototype.compileTemplate = function(data) {
    if(!data) data = this.data;
    /*** Prepare data ***/
    var images = data.images_info;
    // Displaying price base on the policy of Shopify, have to multiple by 100
    var soldOut = !data.available; // Check a product is out of stock
    var onSale = data.compare_at_price_min > data.price_min; // Check a product is on sale
    var priceVaries = data.price_min != data.price_max; // Check a product has many prices
    // Get First Variant (selected_or_first_available_variant)
    var firstVariant = data['variants'][0];
    if (Utils.getParam('variant') !== null && Utils.getParam('variant') != '') {
      var paramVariant = data.variants.filter(function(e) {
        return e.id == Utils.getParam('variant');
      });
      if (typeof paramVariant[0] !== 'undefined') firstVariant = paramVariant[0];
    } else {
      for (var i = 0; i < data['variants'].length; i++) {
        if (data['variants'][i].available) {
          firstVariant = data['variants'][i];
          break;
        }
      }
    }
    /*** End Prepare data ***/
    
    // Get Template
    var itemHtml = boostPFSTemplate.productGridItemHtml;
    // Add a specific class for grid item
    var itemGridWidthClass = '';
    var imageSize = '600x600';

    switch (boostPFSConfig.custom.products_per_row) {
      case 2:
        itemGridWidthClass = 'medium-up--one-half';
        imageSize = '540x600';
        break;
      case 3:
        itemGridWidthClass = 'small--one-half medium-up--one-third';
        imageSize = '345x550';
        break;
      case 4:
        itemGridWidthClass = 'small--one-half medium-up--one-quarter';
        imageSize = '250x';
        break;
      case 5:
        itemGridWidthClass = 'small--one-half medium-up--one-fifth';
        imageSize = '195x';
        break;
    }
    itemHtml = itemHtml.replace(/{{itemGridWidthClass}}/g, itemGridWidthClass);

    // Add soldOut class
    var itemSoldOutClass = soldOut ? boostPFSTemplate.soldOutClass : '';
    itemHtml = itemHtml.replace(/{{itemSoldOutClass}}/g, itemSoldOutClass);

    // Add soldOut label
    var itemSoldOutLabel = soldOut ? boostPFSTemplate.soldOutLabelGridHtml : '';
    itemHtml = itemHtml.replace(/{{itemSoldOutLabel}}/g, itemSoldOutLabel);

    var imgId = 'ProductCardImage-' + data.id;
    var wrapperId = 'ProductCardImageWrapper-' + data.id;

    // Build Image style
    var imageStyle = buildImageStyle(data);
    itemHtml = itemHtml.replace(/{{imageStyle}}/g, imageStyle);

    // Add Images
    var aspect_ratio = '';
    var itemImagesHtml = '<div id="' + wrapperId + '" class="grid-view-item__image-wrapper js">';
    itemImagesHtml += '<div style="padding-top:';
    if (images.length > 0) {
      aspect_ratio = images[0]['width'] / images[0]['height'];
      itemImagesHtml += 1 / aspect_ratio * 100;
    } else {
      itemImagesHtml += 100;
    }
    itemImagesHtml += '%;">';
    itemImagesHtml += '<img id="' + imgId + '" ' +
      'class="grid-view-item__image lazyload" ' +
      'src="' + Utils.getFeaturedImage(images, '300x300') + '" ' +
      'data-src="' + Utils.getFeaturedImage(images, '{width}x') + '" ' +
      'data-widths="[180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048]" ' +
      'data-aspectratio="' + aspect_ratio + '" ' +
      'data-sizes="auto" ' +
      'alt="{{itemTitle}}">';
    itemImagesHtml += '</div>';
    itemImagesHtml += '</div>';

    var image_size = boostPFSConfig.custom.max_height + 'x' + boostPFSConfig.custom.max_height;
    var max_width = images.length > 0 ? boostPFSConfig.custom.max_height * aspect_ratio : 0;
    itemImagesHtml += '<noscript><img class="grid-view-item__image" src="' + Utils.getFeaturedImage(images, image_size + '@2x') + '" alt="{{itemTitle}}" style="max-width: ' + max_width + 'px;"></noscript>';
    itemHtml = itemHtml.replace(/{{itemImages}}/g, itemImagesHtml);

    // Add Vendor
    var itemVendorHtml = boostPFSConfig.custom.vendor_enable ? boostPFSTemplate.vendorGridHtml : '';
    itemHtml = itemHtml.replace(/{{itemVendor}}/g, itemVendorHtml);

    // Add Price
    var itemPriceHtml = buildPrice(data, onSale, priceVaries);
    itemHtml = itemHtml.replace(/{{itemPrice}}/g, itemPriceHtml);

    // Add data json
    itemHtml = itemHtml.replace(/{{itemJson}}/g, JSON.stringify(data.json));

    // Add main attribute
    itemHtml = itemHtml.replace(/{{itemId}}/g, data.id);
    itemHtml = itemHtml.replace(/{{itemTitle}}/g, data.title);
    itemHtml = itemHtml.replace(/{{itemVendorLabel}}/g, data.vendor);
    itemHtml = itemHtml.replace(/{{itemUrl}}/g, Utils.buildProductItemUrl(data));

    return itemHtml;
  }

  ProductListItem.prototype.compileTemplate = function(data) {
    if (!data) data = this.data;
    /*** Prepare data ***/
    var images = data.images_info;
    // Displaying price base on the policy of Shopify, have to multiple by 100
    var soldOut = !data.available; // Check a product is out of stock
    var onSale = data.compare_at_price_min > data.price_min; // Check a product is on sale
    var priceVaries = data.price_min != data.price_max; // Check a product has many prices
    // Get First Variant (selected_or_first_available_variant)
    var firstVariant = data['variants'][0];
    if (Utils.getParam('variant') !== null && Utils.getParam('variant') != '') {
      var paramVariant = data.variants.filter(function(e) {
        return e.id == Utils.getParam('variant');
      });
      if (typeof paramVariant[0] !== 'undefined') firstVariant = paramVariant[0];
    } else {
      for (var i = 0; i < data['variants'].length; i++) {
        if (data['variants'][i].available) {
          firstVariant = data['variants'][i];
          break;
        }
      }
    }
    /*** End Prepare data ***/
  
    // Get Template
    var itemHtml = boostPFSTemplate.productListItemHtml;
  
    // Add onSale label
    var itemSaleLabel = onSale ? boostPFSTemplate.saleLabelListHtml : '';
    itemHtml = itemHtml.replace(/{{itemSaleLabel}}/g, itemSaleLabel);
  
    // Add soldOut label
    var itemSoldOutLabel = soldOut ? boostPFSTemplate.soldOutLabelListHtml : '';
    itemHtml = itemHtml.replace(/{{itemSoldOutLabel}}/g, itemSoldOutLabel);
  
    // Add Thumbnail
    var itemThumbUrl = images.length > 0 ? Utils.optimizeImage(images[0]['src'], '600x600') : boostPFSConfig.general.no_image_url;
    itemHtml = itemHtml.replace(/{{itemThumbUrl}}/g, itemThumbUrl);
  
    // Add Vendor
    var itemSmallVendorHtml = boostPFSConfig.custom.vendor_enable ? boostPFSTemplate.vendorSmallListHtml : '';
    itemHtml = itemHtml.replace(/{{itemSmallVendor}}/g, itemSmallVendorHtml);
    var itemMediumVendorHtml = boostPFSConfig.custom.vendor_enable ? boostPFSTemplate.vendorMediumListHtml : '';
    itemHtml = itemHtml.replace(/{{itemMediumVendor}}/g, itemMediumVendorHtml);
  
    // Add Price
    var itemPriceHtml = buildPrice(data, onSale, priceVaries);
    itemHtml = itemHtml.replace(/{{itemPrice}}/g, itemPriceHtml);
  
    // Add main attribute
    itemHtml = itemHtml.replace(/{{itemTitle}}/g, data.title);
    itemHtml = itemHtml.replace(/{{itemVendorLabel}}/g, data.vendor);
    itemHtml = itemHtml.replace(/{{itemUrl}}/g, Utils.buildProductItemUrl(data));
  
    return itemHtml;
  }

  // Build Image style
  function buildImageStyle(data) {
    var images = data.images_info;
    var imgId = 'ProductCardImage-' + data.id;
    var wrapperId = 'ProductCardImageWrapper-' + data.id;
    var imageStyle = '';
    if (images.length > 0) {
      var image = images[0];
      var width = boostPFSConfig.custom.max_height;
      var height = boostPFSConfig.custom.max_height;
      var aspect_ratio = image.width / image.height;
      var small_style = true;
      var container_aspect_ratio = width * 1.0 / height;

      if (image.aspect_ratio < 1.0) {
        var maximum_width = height * aspect_ratio;
        if (image.height <= height) {
          var maximum_height = image.height;
          maximum_width = image.width;
        } else {
          var maximum_height = height;
        }
      } else if (aspect_ratio < container_aspect_ratio) {
        var maximum_height = height / aspect_ratio;
        if (image.height <= height) {
          var maximum_height = image.height;
          var maximum_width = image.width;
        } else {
          var maximum_height = height;
          var maximum_width = height * aspect_ratio;
        }
      } else {
        var maximum_height = height / aspect_ratio;
        if (image.width <= width) {
          maximum_height = image.height;
          var maximum_width = image.width
        } else {
          var maximum_width = width;
          maximum_height = maximum_width / aspect_ratio;
        }
      }

      imageStyle += '<style>';
      if (small_style) imageStyle += '@media screen and (min-width: 750px) {';
      imageStyle += '#' + imgId + ' {' +
        'max-width: ' + maximum_width + 'px;' +
        'max-height: ' + maximum_height + 'px;' +
        '}' +
        '#' + wrapperId + ' {' +
        'max-width: ' + maximum_width + 'px;' +
        'max-height: ' + maximum_height + 'px;' +
        '}';
      if (small_style) imageStyle += '}';

      if (small_style) {
        if (aspect_ratio < 1) {
          maximum_width = 750 * aspect_ratio;
        } else {
          if (image.width < 750) {
            maximum_width = image.width;
          } else {
            maximum_width = 750;
          }
        }
        imageStyle += '@media screen and (max-width: 749px) {'
        imageStyle += '#' + imgId + ' {' +
          'max-width: ' + maximum_width + 'px;' +
          'max-height: 750px;' +
          '}' +
          '#' + wrapperId + ' {' +
          'max-width: ' + maximum_width + 'px;' +
          '}';
        imageStyle += '}';
      }
      imageStyle += '</style>';
    }
    return imageStyle;
  }

  function buildPrice(data, onSale, priceVaries) {
    var priceHtml = '',
      onSaleClass = onSale ? ' price--on-sale' : '';
  
    priceHtml += '<dl class="price' + onSaleClass + '" data-price>';
    if (boostPFSConfig.custom.vendor_enable) {
      priceHtml += '<div class="price__vendor">';
      priceHtml += '<dt>';
      priceHtml += '<span class="visually-hidden">' + boostPFSConfig.label.vendor + '</span>';
      priceHtml += '</dt>';
      priceHtml += '<dd>';
      priceHtml += data.vendor;
      priceHtml += '</dd>';
      priceHtml += '</div>';
    }
    priceHtml += '<div class="price__regular">';
    priceHtml += '<dt>';
    priceHtml += '<span class="visually-hidden visually-hidden--inline">' + boostPFSConfig.label.regular_price + '</span>';
    priceHtml += '</dt>';
    priceHtml += '<dd>';
    priceHtml += '<span class="price-item price-item--regular" data-regular-price>';
    if (data.available) {
      if (onSale) {
        priceHtml += Utils.formatMoney(data.compare_at_price_min, Globals.moneyFormat);
      } else {
        priceHtml += Utils.formatMoney(data.price_min, Globals.moneyFormat);
      }
    } else {
      priceHtml += boostPFSConfig.label.sold_out;
    }
    var availableWithTags = data.available && data.tags && data.tags.length
    var tenPercentTag = '10% adicional'
    if (availableWithTags && data.tags.find(t => t.toLowerCase() === tenPercentTag )) {
      priceHtml += '<div class="price__badge price__badge--percent-off" style="display: inline-block; color: white; background: black; border-color: black; text-transform: lowercase;"> ';
      priceHtml += '<span class="perc">-10%</span> <span class="labl">adic.</span>';
      priceHtml += '</div>';
    }
    var customPercentTag = 'adic:'
    if (availableWithTags) {
      var customPercent = data.tags.find(t => t.toLowerCase().indexOf(customPercentTag) > -1)
      if (customPercent) {
          var customPercentAmount = customPercent.split(':') && customPercent.split(':')[1] 
          priceHtml += '<div class="price__badge price__badge--percent-off" style="display: inline-block; color: white; background: black; border-color: black; text-transform: lowercase;"> ';
          priceHtml += '<span class="perc">-'+ customPercentAmount +'%</span> <span class="labl">adic.</span>';
          priceHtml += '</div>'; 
      }
    }
    priceHtml += '</span>';
    priceHtml += '</dd>';
    priceHtml += '</div>';
    priceHtml += '<div class="price__sale price__badges price__badges--listing">';
    priceHtml += '<dt>';
    priceHtml += '<span class="visually-hidden visually-hidden--inline">' + boostPFSConfig.label.sale_price + '</span>';
    priceHtml += '</dt>';
    priceHtml += '<dd>';
    priceHtml += '<span class="price-item price-item--sale" data-sale-price>';
    priceHtml += Utils.formatMoney(data.price_min, Globals.moneyFormat);
	if (data.available && onSale) {
      var discountPercentage = (((data.compare_at_price_min - data.price_min) / (data.compare_at_price_min)) * 100)
//       discountPercentage = (Math.round(discountPercentage) !== discountPercentage) ? discountPercentage.toFixed(0) : discountPercentage.toFixed(2)
      discountPercentage = discountPercentage.toFixed(0)
      priceHtml += ' <dd style="text-decoration: line-through; color: #333232;">';
      priceHtml += Utils.formatMoney(data.compare_at_price_min, Globals.moneyFormat);
      priceHtml += '</dd>';
      priceHtml += '<div class="price__badge price__badge--sale" style="display: inline-block"> ';
      priceHtml += '-' + discountPercentage + '%';
      priceHtml += '</div>';
	}
    var tenPercentTag = '10% adicional'
    if (data.available && data.tags && data.tags.length && data.tags.find(t => t.toLowerCase() === tenPercentTag )) {
      priceHtml += '<div class="price__badge price__badge--percent-off" style="margin-top: 11px; display: inline-block; color: white; background: black; border-color: black; text-transform: lowercase;"> ';
      priceHtml += '<span class="perc">-10%</span> <span class="labl">adic.</span>';
      priceHtml += '</div>';
    }
    var customPercentTag = 'adic:'
    if (availableWithTags) {
      var customPercent = data.tags.find(t => t.toLowerCase().indexOf(customPercentTag) > -1)
      if (customPercent) {
          var customPercentAmount = customPercent.split(':') && customPercent.split(':')[1] 
          priceHtml += '<div class="price__badge price__badge--percent-off" style="display: inline-block; color: white; background: black; border-color: black; text-transform: lowercase;"> ';
          priceHtml += '<span class="perc">-'+ customPercentAmount +'%</span> <span class="labl">adic.</span>';
          priceHtml += '</div>'; 
      }
    }
    priceHtml += '</span> ';
	priceHtml += '</div>';
    priceHtml += '</dd>';
    priceHtml += '</div>';
    priceHtml += '</dl>';
      
    return priceHtml;
  }

  /// Build Pagination
  ProductPaginationDefault.prototype.compileTemplate = function(totalProduct) {
    if (!totalProduct) totalProduct = this.totalProduct;
    // Get page info
    var currentPage = parseInt(Globals.queryParams.page);
    var totalPage = Math.ceil(totalProduct / Globals.queryParams.limit);
  
    // If it has only one page, clear Pagination
    if (totalPage <= 1) {
      return '';
    }
  
    if (Settings.getSettingValue('general.paginationType') == 'default') {
      var paginationHtml = boostPFSTemplate.paginateHtml;
  
      // Build Previous
      var previousHtml = (currentPage > 1) ? boostPFSTemplate.previousActiveHtml : boostPFSTemplate.previousDisabledHtml;
      previousHtml = previousHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, currentPage - 1));
      paginationHtml = paginationHtml.replace(/{{previous}}/g, previousHtml);
  
      // Build Next
      var nextHtml = (currentPage < totalPage) ? boostPFSTemplate.nextActiveHtml : boostPFSTemplate.nextDisabledHtml;
      nextHtml = nextHtml.replace(/{{itemUrl}}/g, Utils.buildToolbarLink('page', currentPage, currentPage + 1));
      paginationHtml = paginationHtml.replace(/{{next}}/g, nextHtml);
  
      // Build page items
      var currentPage = boostPFSConfig.label.current_page.replace(/{{ current }}/g, currentPage).replace(/{{ total }}/g, totalPage);
      paginationHtml = paginationHtml.replace(/{{pageItems}}/g, currentPage);
  
      return paginationHtml;
    }
  };

  // Build Sorting
  ProductSorting.prototype.compileTemplate = function() {
    var html = '';
    if (boostPFSTemplate.hasOwnProperty('sortingHtml')) {
      var sortingArr = Utils.getSortingList();
      if (sortingArr) {
        // Build content
        var sortingItemsHtml = '';
        for (var k in sortingArr) {
          sortingItemsHtml += '<option value="' + k + '">' + sortingArr[k] + '</option>';
        }
        html = boostPFSTemplate.sortingHtml.replace(/{{sortingItems}}/g, sortingItemsHtml);
      }
    }
    return html;
  };

  // Build Display type
  ProductDisplayType.prototype.compileTemplate = function() {
    var itemHtml = '<span>View As </span>';
    itemHtml += '<a href="' + Utils.buildToolbarLink('display', 'list', 'grid') + '" title="Grid view" class="{{class.productDisplayType}}-item {{class.productDisplayType}}-grid" data-view="grid"><span class="icon-fallback-text"><span class="fallback-text">Grid view</span></span></a>';
    itemHtml += '<a href="' + Utils.buildToolbarLink('display', 'grid', 'list') + '" title="List view" class="{{class.productDisplayType}}-item {{class.productDisplayType}}-list" data-view="list"><span class="icon-fallback-text"><span class="fallback-text">List view</span></span></a>';
    itemHtml = itemHtml.replace(/{{class.productDisplayType}}/g, Class.productDisplayType);

    return itemHtml;
  };

  // Add additional feature for product list, used commonly in customizing product list
  ProductList.prototype.afterRender = function(data) {
    if (!data) data = this.data;
    var productSelector = jQ(Selector.products);
    if (Globals.queryParams.display == 'list') {
      if (productSelector.children('.list-view-items').length == 0) {
        productSelector.children().wrapAll('<ul class="list-view-items"></ul>');
      }
      productSelector.removeClass('grid grid--uniform grid--view-items');
    } else {
      if (productSelector.children('.list-view-items').length > 0) {
        productSelector.children('.list-view-items').children().unwrap();
      }
      productSelector.addClass('grid grid--uniform grid--view-items');
    }
  }

  // Build Additional Elements
  FilterResult.prototype.afterRender = function(data, eventType) {
    if (!data) data = this.data;
    var totalProduct = '';
    if (data.total_product == 1) {
      totalProduct = boostPFSConfig.label.items_with_count_one.replace(/{{ count }}/g, data.total_product);
    } else {
      totalProduct = boostPFSConfig.label.items_with_count_other.replace(/{{ count }}/g, data.total_product);
    }
    jQ('.boost-pfs-filter-total-product').html(totalProduct);
    
	//Custom code for same heights
    var longestHeightTitle = 0;
	var biggestImage = 0
    //Reduce font-size based on lines
    jQ(".grid-view-item .grid-view-item__title").each(function(index){
        var innerTitle = jQ(this).find(".product-card__title");
        var fontSize = parseInt(innerTitle.css("font-size"))
        var messageLines = innerTitle[0].getClientRects().length
        if(messageLines > 3){
          innerTitle.addClass('truncate-overflow')
          //innerTitle.css("font-size" , fontSize - 2)
        }    
    })
    //Retrieve the biggest title
    jQ(".grid-view-item .grid-view-item__title").each(function(index){
      if(jQ(this).height() > longestHeightTitle){
        longestHeightTitle = jQ(this).height()      
      }
    })
	//Retrieve the biggest image
    jQ(".grid-view-item .grid-view-item__image-wrapper").each(function(index){
      if(jQ(this).height() > biggestImage){
        biggestImage = jQ(this).height();      
      }
    })
    //Set equal height
    jQ(".grid-view-item .grid-view-item__title").css({
      height: longestHeightTitle,
      display: 'block'
    }) 
    
    jQ(".grid-view-item .grid-view-item__image-wrapper").css({
      height: biggestImage,
      maxHeight: 'initial',
      paddingTop: '0px'
    }) 
    jQ(".grid-view-item .grid-view-item__image-wrapper div").css({
      height: biggestImage,
      paddingTop: '0px'
    }) 
    jQ(".grid-view-item .grid-view-item__image-wrapper img").css({
      height: biggestImage,
      objectFit: 'contain'
    }) 
 
    $.each(data.products, function(idx, item) {
      var referencesHandlers = []
                  
      $.each(item.metafields, function(index, metafield){
        if (metafield.namespace == 'references') { 
          if (metafield.key === 'handlers') {
            referencesHandlers = metafield.value && metafield.value.replace(/\s/g, '').split(',')
          }
        }
      });
      
      var referencesProducts = $.grep(data.products, function(item, idx) { 
        return $.inArray(item.handle && item.handle.trim(), referencesHandlers) > -1
      })
                  
      var $element = $('.boost-pfs-filter-products .grid__item[data-id="'+ item.id +'"]')
      var $mainImg = $element.find('.grid-view-item__image')
      var $wrapper = $element.find('.grid-view-item__link.grid-view-item__image-container:first')
      var $count = $wrapper.find('.grid-view-item-variants-count');
	  var referencesLenght = referencesProducts.length || 1
      var countText = referencesLenght + ' '+ (referencesLenght > 1 ? 'colores' : 'color')
            
      if (!$wrapper.find('.grid-view-item-variants-count').length) {
        $element.find('.product-card').append('<p class="grid-view-item-variants-count">'+ countText + '</p>')
      } else {
        $count.text(countText)
      }
      
      $mainImg.addClass('grid-view-item__image-main')
                
      var itemReferencesHtml = '<div class="grid-view-item-icons">'
            
      $.each(referencesProducts, function(i, product) {
//         var tags = $.grep(product.tags, function(e, i) {
//           return e.toLowerCase().indexOf('color:') > -1
//         }) 
//         var color = tags && tags.length && tags[0].replace('color:', '')
//         itemReferencesHtml += '<a href="/products/'+ product.handle +'" class="grid-view-item__color boost-pfs-action-overlay" title="'+ color +'"><img class="visually-hidden" height="42" src="'+ product.images[1] +'"></a>'
        var data_origin = product.id === item.id ? 'data-origin="1"' : ''
        var discount = (((product.compare_at_price_min - product.price_min) / (product.compare_at_price_min)) * 100)
        var discount = discount && parseInt(discount)
        itemReferencesHtml += '<a href="/products/'+ product.handle +'" class="grid-view-item__image related-image" data-discount="'+ discount +'" '+ data_origin +'><img height="42" src="'+ product.images[1] +'"></a>'

      })
      
	  if (!referencesProducts.length) { //fallback if there is not colors data available
        var discount = (((item.compare_at_price_min - item.price_min) / (item.compare_at_price_min)) * 100)
        var discount = discount && parseInt(discount)
        itemReferencesHtml  += '<a href="/products/'+ item.handle +'" class="grid-view-item__image related-image" data-discount="'+ discount +'" data-origin="1"><img height="42" src="'+ item.images[1] +'"></a>'
      }

      itemReferencesHtml += '</div>';
      $element.find('.product-card').append(itemReferencesHtml);
    })
    
          
    
  };
})();


/* Begin patch boost-010 run 2 */
Filter.prototype.beforeInit=function(){var t=this.isBadUrl();t&&(this.isInit=!0,window.location.href=window.location.pathname)},Filter.prototype.isBadUrl=function(){try{var t=decodeURIComponent(window.location.search).split("&"),e=!1;if(t.length>0)for(var n=0;n<t.length;n++){var i=t[n],r=(i.match(/</g)||[]).length,a=(i.match(/>/g)||[]).length,o=(i.match(/alert\(/g)||[]).length,h=(i.match(/execCommand/g)||[]).length;if(r>0&&a>0||r>1||a>1||o||h){e=!0;break}}return e}catch(l){return!0}};
/* End patch boost-010 run 2 */
