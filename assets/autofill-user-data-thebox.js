$(document).ready(function() {
  
  	 function capitalize(str) {
       var splitStr = str.toLowerCase().split(' ');
       for (var i = 0; i < splitStr.length; i++) {
           // You do not need to check if i is larger than splitStr length, as your for does that for you
           // Assign it back to the array
           splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
       }
       // Directly return the joined string
       return splitStr.join(' '); 
     }
  
     function removeAccents(strAccents) {
      var strAccents = strAccents.split('');
      var strAccentsOut = new Array();
      var strAccentsLen = strAccents.length;
      var accents =    "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
      var accentsOut = "AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz";
      for (var y = 0; y < strAccentsLen; y++) {
          if (accents.indexOf(strAccents[y]) != -1) {
              strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
          } else
              strAccentsOut[y] = strAccents[y];
      }
      strAccentsOut = strAccentsOut.join('');

      return strAccentsOut;
    }

  

   function autofillUserDataUpdateDepartments(form) {

    try {
      var $form = $(form)
      
      var $selectedCountry = $form.find('[name="País"]').find(':selected');
      var $deparmentBox = $form.find('[name="Departamento"]');
        
      if (!$selectedCountry || !$selectedCountry.val()) {
        $deparmentBox.prop('disabled', true);
        return
      }
      
      var departmentsList = $.parseJSON(document.getElementById('ubigeosDepartamentosJSON').innerHTML);
        
      departmentsList = _.sortBy(departmentsList, function (department) {
          return removeAccents(department.name).toLowerCase();
      });
        
      $deparmentBox.prop('disabled', false)
                   .html('')
                   .prepend('<option disabled selected hidden value="">Elige una opción</option>').val('');
  
      departmentsList.forEach(function(department) {
        var Departamentoption = department;
        if (Departamentoption && Departamentoption.name !== 'Lima (provincia)') {
          $deparmentBox.append($("<option></option>")
          .attr("value", Departamentoption.name && Departamentoption.name.trim())
          .text(Departamentoption.name)
		  .attr("data-id", Departamentoption.id));
        }
      });
    } catch (error) {
      console.log(error)
    }

  }

  function autofillUserDataUpdateProvinces(form, selected) {

    try {
      
      var $form = $(form)
            
      var $selectedDepartment = selected ? $(selected) : $form.find('[name="Departamento"]').find('option:selected');
      var $provinceBox = $form.find('[name="Provincia"]');
      var $districtBox =  $form.find('[name="Distrito"]');
                                      
      if (!$selectedDepartment || !$selectedDepartment.val()) {
        $provinceBox.prop('disabled', true);
        return false;
      }
  
      var selectedDepartmentValue = $selectedDepartment.val() && removeAccents($selectedDepartment.val().toUpperCase());

      if (selectedDepartmentValue === 'LIMA (DEPARTAMENTO)' || selectedDepartmentValue === 'LIMA (PROVINCIA)') {
        selectedDepartmentValue = 'LIMA'
      }
      
      var provincesList = $.parseJSON(document.getElementById('ubigeosProvinciasJSON').innerHTML);

      var provincesList = _.filter(provincesList, function(province) {
        return province.department_id === $selectedDepartment.attr('data-id')
      });

      provincesList = _.sortBy(provincesList, function (province) {
          return removeAccents(province.name).toLowerCase();
      });

      $provinceBox.add($districtBox).prop('disabled', false)
                   .html('')
                   .prepend('<option disabled selected hidden value="">Elige una opción</option>').val('');

      provincesList.forEach(function(province) {
        var provinceOption = province;
        if (provinceOption) {
          $provinceBox.append($("<option></option>")
          .attr("value", provinceOption.name && provinceOption.name.trim())
          .text(provinceOption.name)
		  .attr('data-id', provinceOption.id)
		  .attr('data-department_id', provinceOption.department_id));
        }
      });
    } catch (error) {
      console.log(error);
    }

  }

  function autofillUserDataUpdateDistricts(form, selected) {

    try {
      
      var $form = $(form)
      var $selectedProvince = selected ? $(selected) : $form.find('[name="Provincia"]').find(':selected');
      var $districtBox =  $form.find('[name="Distrito"]');
      var districtsList = [];
  
      if (!$selectedProvince || !$selectedProvince.val()) {
        $districtBox.prop('disabled', true);
        return false;
      }
  
      var selectedProvinceValue = $selectedProvince.val() && removeAccents($selectedProvince.val());

      var districtsList = $.parseJSON(document.getElementById('ubigeosDistritosJSON').innerHTML);

      var districtsList = _.filter(districtsList, function(district) {
        return district.province_id === $selectedProvince.attr('data-id') && district.active
      });

      districtsList = _.sortBy(districtsList, function (district) {
          return removeAccents(district.name).toLowerCase();
      });

      districtsList.sort()

      $districtBox.prop('disabled', false)
                   .html('')
                   .prepend('<option disabled selected hidden value="">Elige una opción</option>').val('');

      districtsList.forEach(function(district) {
        var districtOption = district;
        if (districtOption) {
          $districtBox.append($("<option></option>")
          .attr("value", districtOption.name && districtOption.name.trim() && removeAccents(districtOption.name.trim()))
          .text(districtOption.name)
          .attr('data-id', districtOption.id)
          .attr('data-province_id', districtOption.province_id)
		  .attr('data-department_id', districtOption.department_id));
        }
      });
      
      if (!districtsList.length) {
      	$districtBox.html('').prop('disabled', true).prepend('<option disabled selected hidden value="">Aún no hay distritos para atención en esta provincia</option>').val('');
      }
      
    } catch (error) {
      console.log(error);
    }

  }
  
  function autofillUserDataSetDefaultValues(form) {
    
    try {
      var $form = $(form)
      var $defaultedSelectBoxes = $form.find('select[data-default]');
      
      $form.attr('novalidate', true)

      if (!$defaultedSelectBoxes || !$defaultedSelectBoxes.length) return
      
      $defaultedSelectBoxes.prop('disabled', false)

      $defaultedSelectBoxes.each(function(i, item){
          var $box = $(item);
          var boxName = $box.attr('name');
          var defaultValue = $box.attr('data-default')
          if (!defaultValue) {
          	return 
          }

          var $option = null
		  
          $box.children('option').each(function(i) {
            var $opt = $(this)
            var value = $opt.val() && $opt.val().toUpperCase().trim().replace(/ /g, '')
            defaultValue = defaultValue && defaultValue.toUpperCase().trim().replace(/ /g, '')
            if (removeAccents(value) === removeAccents(defaultValue)) {
              $option = $opt
            }
          })
         
          var optionExists = !!$option
          
          if (optionExists) {
              switch(boxName) {
                case 'Departamento':
              		autofillUserDataUpdateProvinces($form, $option)
                    autofillUserDataUpdateDistricts($form, $option)
                  break;
                case 'Provincia':
                    autofillUserDataUpdateDistricts($form, $option)
                  break;
                default:
              }
            $option.prop('selected', true)
          }
      })
    
    } catch(e) {
    	console.log(e)
    }
  }
  
  
  function autofillUserDataInit($form) {
    autofillUserDataUpdateDepartments($form);
    autofillUserDataUpdateProvinces($form);
    autofillUserDataUpdateDistricts($form);
  }
  
  function onShippingMethodUpdate(form, cleanup) {
    var $form = $(form) 
    var isStorePickup = $form.find('.shipping-method-selector [name="shipping_method"]:checked').val() === 'store_pickup'
    var $addressFields = $form.find('[name="Dirección"], [name="Int/Dpto"], [name="Referencias"], [name="País"], [name="Departamento"], [name="Provincia"], [name="Distrito"]');
    var cleanup = cleanup || false
	var $storePicker = $form.find('.store-picker')
    var $selectedStoreData = $form.find('.selected-store-data')
    var $selectedStoreFields = $selectedStoreData.find('[data-selected-store]')
    var $mainTitle = $form.find('.autofill-user-data-thebox-main-title')
    var $storeSelector = $form.find('[name="Tienda"]')
    
    if (!isStorePickup || cleanup) {
        $addressFields.not('[name="País"]').find('option[data-storePickup]').remove()
    	$addressFields.not('[name="País"]').val('')
        $selectedStoreFields.text('')
		$storeSelector.val('')
    }
    
    if (isStorePickup) {
        if (!$storeSelector.val()) {
          	var firstOptionVal = $storeSelector.find('option:not(:disabled):first').val()
        	$storeSelector.val(firstOptionVal)
        }
      	$storeSelector.trigger('change')
    }

	$storePicker.toggleClass('active', isStorePickup)
    $addressFields.parent().toggle(!isStorePickup)
    $mainTitle.toggleClass('active', !isStorePickup)
    $form.find('.store-pickup-autofill-user-data-thebox-action-submit-wrapper').toggle(isStorePickup)
  }
  
   function fetchStorePickupLocations(callback) {
    	window.oym_storepickup_locations = []
    
         function defer(method, validation) {
              if (validation()) {
                method();
              } else {
                setTimeout(function() { defer(method, validation) }, 50);
              }
          }
     
         function fallback() {
           var randomQuery =  '_' + Math.random().toString(36).substr(2, 9)   
           $.getJSON('//cdn.shopify.com/s/files/1/0373/4513/2676/t/71/assets/store-pickup.json?v=' + randomQuery, {}, 'JSON').then(function(result, status) {
             if (status === 'error') {
               console.log('error on fallback: shipping locations')
             }
             console.log('fallback: shipping locations')
             window.oym_storepickup_locations = result
             callback && callback(window.oym_storepickup_locations)
           })
         }
     
     	  window.supaBaseResponse = null

          defer(async function(){ 
            try {
              var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZm91c3FvZmd6ZGR6ZXB4aGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDU2NDcwMTgsImV4cCI6MTk2MTIyMzAxOH0.BEGFANq0-6iGF3YJqPFZUF_8p0U5J6LkJFA20q97DaU'

              var SUPABASE_URL = "https://ukfousqofgzddzepxhkd.supabase.co"

              var supabaseDB = supabase.createClient(SUPABASE_URL, SUPABASE_KEY)

              supabaseDB
                .from('storepickup_locations')
              	.select('*')
              	.then(function(result) {
                	window.supaBaseResponse = { data: result.data, error: result.error } 
              	})
              
              defer(function(){ 
                  try {
                    var storepickup_locations = window.supaBaseResponse.data

                    window.oym_storepickup_locations = storepickup_locations

                    if (window.supaBaseResponse.error) {
                      throw window.supaBaseResponse.error
                    }

                    callback && callback(window.oym_storepickup_locations)
                  } catch(error) {
                  	console.log(error)
                    fallback()
                  }
                
              }, function() { return window.supaBaseResponse  })
              
            } catch(error) {
              	console.log(error)
				fallback()
            }
            
          }, function() { return window.jQuery && window.supabase })
  }
  
  function storePickupLoadStores($form) {
    var $storePickupButton = $('[name="shipping_method"][value="store_pickup"]')
    var $wrapper = $storePickupButton.parent()
    
    $wrapper.addClass('loading')
            
    function callback(stores) {
		var storesList = stores
        var $storePicker = $form.find('.store-picker select')
        
        storesList = _.filter(storesList, function(store) {
            return store.active
        });

        storesList = _.map(storesList, function(store) {
            store.name = store.name && capitalize(store.name)
            store.address1 = store.address1 && capitalize(store.address1)
            store.address2 = store.address2 && capitalize(store.address2)
            store.reference = store.reference && capitalize(store.reference)
            store.province = store.province && capitalize(store.province)
            store.city = store.city && capitalize(store.city)
            store.zip = store.zip && capitalize(store.zip)
            return store
        })

        $storePicker.prop('disabled', false)
                    .html('')
                    .prepend('<option disabled hidden selected value="">Elige una opción</option>').val('');

        storesList.forEach(function(store, index) {
            var option = store;
            if (option) {
              var elAttrs = '' // index === 0 ? 'selected="selected"' : ''
              var elTag = '<option '+ elAttrs +'></option>'
              var $optionEl = $storePicker.append($(elTag)
              .attr("value", option.name && option.name.trim())
              .text(option.name)
              .attr('data-id', option.id)
              .attr('data-model', JSON.stringify(option))); // dont use regular data as it's failing to work on Chrome since 98.0.4758.82 
            }
        });
      
      	$storePickupButton.prop('disabled', false)
    	$wrapper.removeClass('loading')
    }
    
    if (!window.oym_storepickup_locations || !window.oym_storepickup_locations.length) {
    	fetchStorePickupLocations(function(stores) {
    		callback(stores)
        });
    } else {
    	callback(window.oym_storepickup_locations)
    }
  }

  
  function onPickupStoreSelect($form) {
     var shippingPickupStore = JSON.parse($form.find('.store-picker [name="Tienda"] :selected').attr('data-model'))
     var $addressFields = $form.find('[name="Dirección"], [name="Int/Dpto"], [name="Referencias"], [name="País"], [name="Departamento"], [name="Provincia"], [name="Distrito"]');
     var $selectedStoreData = $form.find('.selected-store-data')
     var $selectedStoreFields = $selectedStoreData.find('[data-selected-store]')
     $selectedStoreData.removeClass('active')
     $addressFields.each(function(idx) {
        var $field = $(this)
        switch($field.attr('name')) {
          case 'Dirección':
            $field.val(shippingPickupStore.address1);
            break;
          case 'Int/Dpto':
            // code block
            break;
          case 'Referencias':
            $field.val(shippingPickupStore.reference);
            break;
          case 'País':
            $field.val(shippingPickupStore.country_name);
            break;
          case 'Departamento':
            $field.find('option[data-storePickup]').remove();
            $field.append($(new Option(shippingPickupStore.province, shippingPickupStore.province)).attr('data-storePickup', true));
            $field.val(shippingPickupStore.province);
            break;
          case 'Provincia':
			$field.find('option[data-storePickup]').remove();
            $field.append($(new Option(shippingPickupStore.city, shippingPickupStore.city)).attr('data-storePickup', true));
            $field.val(shippingPickupStore.city);
            break;
          case 'Distrito':
            $field.find('option[data-storePickup]').remove();
            $field.append($(new Option(shippingPickupStore.zip, shippingPickupStore.zip)).attr('data-storePickup', true));
            $field.val(shippingPickupStore.zip);
            break;
          default:
        }
      })
     
     $selectedStoreFields.each(function(idx) {
     	var $field = $(this)
        $field.text('')
        $field.text(shippingPickupStore[$field.data('selected-store')])
     });
    
     $selectedStoreData.addClass('active')
  }
  
  ////////// ADDRESS REGISTRATION /////////////////////////////////////

  // change country select box listeners
  $('main').on('change', '.autofill-user-data-thebox [name="País"]', function (e) {
    var $form = $(e.target).closest('form');
    autofillUserDataUpdateDepartments($form);
    autofillUserDataUpdateProvinces($form);
    autofillUserDataUpdateDistricts($form);
  });

  // change department select box listeners
  $('main').on('change', '.autofill-user-data-thebox [name="Departamento"]', function (e) {
    var $form = $(e.target).closest('form');
    autofillUserDataUpdateProvinces($form);
    autofillUserDataUpdateDistricts($form);
  });

  // change department select box listeners
  $('main').on('change', '.autofill-user-data-thebox [name="Provincia"]', function (e) {
    var $form = $(e.target).closest('form');
    autofillUserDataUpdateDistricts($form);
  });

  // clear form fields errors on input update
  $('main').on('input', '.autofill-user-data-thebox select, .autofill-user-data-thebox textarea, .autofill-user-data-thebox input', function (e) {
    $(this).removeClass('input--error');
  });

  $('main').on('change', '.autofill-user-data-thebox [name="agree_terms"]', function(e) {
    $form = $(e.target)
    if (this.checked) {
      $form.find('.errorTermsLabel').addClass('d-none');
    }
  });
    
  $('main').on('change', '.autofill-user-data-thebox .shipping-method-selector [name="shipping_method"]', function(e) {
    var $form = $(e.target).closest('form');
    onShippingMethodUpdate($form, true)
  });

   $('main').on('change', '.autofill-user-data-thebox [name="Tienda"]', function(e) {
     var $form = $(e.target).closest('form');
	 onPickupStoreSelect($form)
   });
    
  $('main').find('.autofill-user-data-thebox').each(function(i) {
    var $form = $(this)
    var $submitButton = $form.find('.autofill-user-data-thebox-action-submit')
    autofillUserDataInit($form)
    autofillUserDataSetDefaultValues($form);
    storePickupLoadStores($form)
    $form.on("keydown", ':input:not(textarea):not(select)', function(event) { 
      var keyIsEnter = event.key === 'Enter'
      if (keyIsEnter) {
        $submitButton.click()
      }
      return !keyIsEnter;
    });
    $form.closest('form').attr('novalidate', 'novalidate')
  });
  /////////////////////////////////////////////////////////////////////


}) 

