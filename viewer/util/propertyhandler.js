/**
 * Created by andreas on 03.05.14.
 */

import Toast from './overlay.js';
import globalStore from './globalstore.jsx';
import keys,{KeyHelper} from './keys.jsx';

/**
 * filter out some tree ob objects
 * @param source
 * @param filterFunction will be called with the current leaf from source and a
 *        path being constructed of hierarchies concat by .
 * @param opt_basepath to be prepended to the path
 * @returns {undefined}
 */
const filterObjectTree=(source,filterFunction,opt_basepath)=>{
    let rt=undefined;
    let path=opt_basepath;
    for (let k in source) {
        let currentPath=path!==undefined?path+"."+k:k;
        if (typeof(source[k]) === 'object') {
            let sub=filterObjectTree(source[k],filterFunction,currentPath);
            if (sub !== undefined) {
                if (rt === undefined) rt={};
                rt[k]=sub;
            }
        }
        else {
            if (filterFunction(source[k], currentPath)) {
                if (rt === undefined) rt = {};
                rt[k] = source[k];
            }
        }
    }
    return rt;
};
/**
 * an event being fired when properties are changed
 * @param {PropertyHandler} propertyHandler
 * @constructor
 */
const PropertyChangeEvent=function(propertyHandler){
    /**
     *
     * @type {PropertyHandler}
     */
    this.propertyHandler=propertyHandler;
};
PropertyChangeEvent.EVENT_TYPE="propertyevent";

//compatibility
avnav.util.PropertyChangeEvent=PropertyChangeEvent;

const applyLayoutLegacy=(nightMode,nightFade,baseFontSize,widgetFontSize,buttonFontSize)=>{
    if (!nightMode) {
        $('#old_pages').removeClass('nightMode');
        $('#old_pages').css('opacity', '1');
    }
    else {
        $('#old_pages').addClass('nightMode');
        $('#old_pages').css('opacity', nightFade / 100)
    }
    $(".avn_button").css('font-size', buttonFontSize + "px");
    $(".avn_dialog button").css('font-size', buttonFontSize + "px");
    $('body').css('font-size', baseFontSize + "px");
    $('.avn_widgetContainer').css('font-size', widgetFontSize + "px");
};

const hex2rgba= (hex, opacity)=> {
    let patt = /^#([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})$/;
    let matches = patt.exec(hex);
    let r = parseInt(matches[1], 16);
    let g = parseInt(matches[2], 16);
    let b = parseInt(matches[3], 16);
    let rgba = "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
    return rgba;
};


/**
 * a storage handler for properties and userData
 * user Data contain a subset of the properties - the changable ones
 * @param propertyDescriptions - a hierarchy of Property
 * @param properties - a hierarchy of Property (2 level..)
 *                     only for compatibility, if a description is set, this one wins...
 * @constructor
 */
class PropertyHandler {
    constructor(propertyDescriptions) {
        let self=this;
        this.propertyDescriptions = KeyHelper.getKeyDescriptions(true);
        this.getProperties=this.getProperties.bind(this);
        this.saveUserData=this.saveUserData.bind(this);
        this.updateLayout=this.updateLayout.bind(this);
        this.getButtonFontSize=this.getButtonFontSize.bind(this);
        this.getColor=this.getColor.bind(this);
        this.getAisColor=this.getAisColor.bind(this);
        this.incrementSequence=this.incrementSequence.bind(this);
        this.dataChanged=this.dataChanged.bind(this);
        let defaults=KeyHelper.getDefaultKeyValues();
        globalStore.storeMultiple(defaults);
        //register at the store for updates of our synced data
        globalStore.register(this,keys.properties);
        if (!window.localStorage) {
            Toast.Toast("local storage is not available, seems that your browser is not HTML5... - application will not work");
            return;
        }
        try {
            let rawdata = localStorage.getItem(globalStore.getData(keys.properties.settingsName));
            if (!rawdata) return;
            let ndata = JSON.parse(rawdata);
            if (ndata) {
                let userData = filterObjectTree(ndata, (item, path)=> {
                    let description = self.propertyDescriptions[path];
                    if (!description) return;
                    return item != globalStore.getData(path);
                }, KeyHelper.keyNodeToString(keys.properties));
                globalStore.storeMultiple(userData, keys.properties, true, true);
            }
        }catch (e){
            avnav.log("Exception reading user data "+e);
        }
        this.updateLayout();
    }

    incrementSequence(){
        globalStore.storeData(keys.gui.global.propertySequence,
            globalStore.getData(keys.gui.global.propertySequence,0),
            this
        );
    }

    /**
     * get the current active properties
     * @deprecated - expensive!
     * @returns {*}
     */
    getProperties() {
        return globalStore.getMultiple(keys.properties);
    }

    /**
     * save the current settings
     */
    saveUserData(data) {
        let raw = JSON.stringify(data);
        localStorage.setItem(globalStore.getData(keys.properties.settingsName), raw);
    }


    dataChanged(store,storeKeys){
        let self=this;
        let values=globalStore.getMultiple(keys.properties);
        this.saveUserData(
            filterObjectTree(values,(item,path)=>{
                let description=self.propertyDescriptions[path];
                if (description === undefined) return false;
                return item !== description.defaultv;
            },KeyHelper.keyNodeToString(keys.properties))
        );
        this.updateLayout();
    }

    /**
     * update the layout
     */
    updateLayout() {
        applyLayoutLegacy(
            globalStore.getData(keys.properties.nightMode),
            globalStore.getData(keys.properties.nightFade),
            globalStore.getData(keys.properties.baseFontSize),
            this.getButtonFontSize()
        );
        this.incrementSequence();
    }

    getButtonFontSize() {
        let numButtons = globalStore.getData(keys.properties.maxButtons);
        let currentButtonHeight = globalStore.getData(keys.properties.style.buttonSize);
        let scale=1;
        let height = window.innerHeight;
        if (height !== undefined) {
            let buttonHeight = height / numButtons - 8; //TODO: should we get this from CSS?
            scale = buttonHeight / currentButtonHeight;
        }
        if (scale > 1) scale = 1;
        return currentButtonHeight * scale / 4;
    }


    getColor(colorName, addNightFade) {
        let rt = globalStore.getData(KeyHelper.keyNodeToString(keys.properties.style)+"." + colorName);
        if (rt === undefined) return rt;
        if ((addNightFade === undefined || addNightFade) && globalStore.getData(keys.properties.nightMode)) {
            let nf = globalStore.getData(keys.properties.nightColorDim);
            return hex2rgba(rt, nf / 100);
        }
        return rt;
    }

    getAisColor(currentObject) {
        let color = "";
        if (currentObject.warning) {
            color = this.getColor('aisWarningColor');
        }
        else {
            if (currentObject.tracking) {
                color = this.getColor('aisTrackingColor');
            }
            else {
                if (currentObject.nearest) {
                    color = this.getColor('aisNearestColor');
                }
                else {
                    color = this.getColor('aisNormalColor');
                }
            }
        }
        return color;
    }

}

module.exports=new PropertyHandler();



