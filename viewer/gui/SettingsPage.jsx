/**
 * Created by andreas on 02.05.14.
 */

import Dynamic from '../hoc/Dynamic.jsx';
import Visible from '../hoc/Visible.jsx';
import Button from '../components/Button.jsx';
import ItemList from '../components/ItemList.jsx';
import globalStore from '../util/globalstore.jsx';
import keys,{KeyHelper,PropertyType} from '../util/keys.jsx';
import React from 'react';
import PropertyHandler from '../util/propertyhandler.js';
import history from '../util/history.js';
import Page from '../components/Page.jsx';
import Toast from '../util/overlay.js';
import assign from 'object-assign';
import ColorPicker from '../components/ColorPicker.jsx';
import CpCss from 'react-color-picker/index.css';
import OverlayDialog from '../components/OverlayDialog.jsx';
import Promise from 'promise';

const settingsSections={
    Layer:      [keys.properties.layers.ais,keys.properties.layers.track,keys.properties.layers.nav,keys.properties.layers.boat,keys.properties.layers.grid,keys.properties.layers.compass,keys.properties.layers.measures],
    UpdateTimes:[keys.properties.positionQueryTimeout,keys.properties.trackQueryTimeout,keys.properties.aisQueryTimeout ],
    Widgets:    [keys.properties.widgetFontSize,keys.properties.showClock,keys.properties.showZoom,keys.properties.showWind,keys.properties.showDepth],
    Layout:     [keys.properties.baseFontSize,keys.properties.smallBreak,keys.properties.allowTwoWidgetRows,keys.properties.autoZoom,keys.properties.style.buttonSize,keys.properties.nightFade,keys.properties.nightChartFade,keys.properties.localAlarmSound,keys.properties.iosWorkaroundTime],
    AIS:        [keys.properties.aisDistance,keys.properties.aisWarningCpa,keys.properties.aisWarningTpa,keys.properties.aisTextSize,keys.properties.style.aisNormalColor,keys.properties.style.aisNearestColor,keys.properties.style.aisWarningColor],
    Navigation: [keys.properties.bearingColor,keys.properties.bearingWidth,keys.properties.navCircleColor,keys.properties.navCircleWidth,keys.properties.navCircle1Radius,keys.properties.navCircle2Radius,keys.properties.navCircle3Radius,
        keys.properties.courseAverageTolerance,keys.properties.gpsXteMax,keys.properties.courseAverageInterval,keys.properties.speedAverageInterval,keys.properties.positionAverageInterval,keys.properties.anchorWatchDefault,keys.properties.anchorCircleWidth,keys.properties.anchorCircleColor,keys.properties.windKnots],
    Track:      [keys.properties.trackColor,keys.properties.trackWidth,keys.properties.trackInterval,keys.properties.initialTrackLength],
    Route:      [keys.properties.routeColor,keys.properties.routeWidth,keys.properties.routingTextSize,keys.properties.routeApproach,keys.properties.routeShowLL]
};


/**
 * will fire a confirm dialog and resolve to 1 on changes, resolve to 0 on no changes
 * @returns {Promise}
 */
const confirmAbortOrDo=()=> {
    if (globalStore.getData(keys.gui.settingspage.hasChanges)) {
        return OverlayDialog.confirm("discard changes?");
    }
    else {
        return new Promise((resolve,reject)=>{
            resolve(0);
        });
    }
};

const SectionItem=(props)=>{
    let className=props.className?props.className+" listEntry":"listEntry";
    if (props.activeItem) className+=" activeEntry";
    return(
        <div className={className} onClick={props.onClick}>{props.name}</div>
    );
};

const CheckBoxSettingsItem=(props)=>{
    return (
    <div className={props.classsName+ " listEntry"}
                onClick={()=>{props.onClick(!props.value);}}>
        <div className="label">{props.label}</div>
        <span className={'avnCheckbox'+(props.value?' checked':'')}/>
    </div>
    );
};

const rangeItemDialog=(item)=>{
    class Dialog extends React.Component{
        constructor(props){
            super(props);
            this.state={
                value: item.value
            };
            this.valueChange=this.valueChange.bind(this);
            this.buttonClick=this.buttonClick.bind(this);
        }
        valueChange(ev){
            this.setState({value: ev.target.value});
        }

        buttonClick(ev){
            let button=ev.target.name;
            if (button == 'ok'){
                if (this.state.value < item.values[0]|| this.state.value > item.values[1]){
                    Toast.Toast("out of range");
                    return;
                }
                item.onClick(this.state.value);
            }
            if (button == 'reset'){
                this.setState({
                    value: item.defaultv
                });
                return;
            }
            Toast.hideToast();
            this.props.closeCallback();
        }
        render() {
            let range=item.values[0]+"..."+item.values[1];
            return(
                <div className="settingsDialog">
                    <h3><span >{item.label}</span></h3>
                    <div className="settingsRange">Range: {range}</div>
                    <div>
                        <label >Value
                            <input type="number"
                                   min={item.values[0]}
                                   max={item.values[1]}
                                   step={item.values[2]||1}
                                   name="value" onChange={this.valueChange} value={this.state.value}/>
                        </label>
                    </div>
                    <button name="ok" onClick={this.buttonClick}>OK</button>
                    <button name="cancel" onClick={this.buttonClick}>Cancel</button>
                    <button name="reset" onClick={this.buttonClick}>Reset</button>
                    <div className="clear"></div>
                </div>
            );
        }
    };
    OverlayDialog.dialog(Dialog);
};
const RangeSettingsItem=(properties)=> {
    return <div className={properties.className+ " listEntry"}
                onClick={function(ev){
                            rangeItemDialog(properties);
                        }}>
        <div className="label">{properties.label}</div>
        <div className="value">{properties.value}</div>
    </div>;
};

const colorItemDialog=(item)=>{
    let colorDialogInstance;
    class Dialog extends React.Component{
        constructor(props){
            super(props);
            this.state={
                value: item.value
            };
            this.valueChange=this.valueChange.bind(this);
            this.buttonClick=this.buttonClick.bind(this);
            this.onDrag=this.onDrag.bind(this);
            this.colorInput=this.colorInput.bind(this);
        }
        valueChange(ev){
            this.setState({value: ev.target.value});
        }
        buttonClick(ev){
            var button=ev.target.name;
            if (button == 'ok'){
                item.onClick(this.state.value);
            }
            if (button == 'reset'){
                this.setState({
                    value: item.defaultv
                });
                return;
            }
            this.props.closeCallback();
        }
        onDrag(color,c){
            this.setState({
                value: color
            })
        }
        colorInput(ev){
            this.setState({
                value:ev.target.value
            })
        }
        render() {
            let style={
                backgroundColor:this.state.value,
                width: 30,
                height: 30
            };
            let pickerProperties={
                saturationWidth: 250,
                saturationHeight: 250,
                hueWidth: 30,
                className: "colorPicker"
            };
            let dimensions=globalStore.getData(keys.gui.global.windowDimensions,{});
            let v = dimensions.height;
            let margin=250;
            if (v) {
                pickerProperties.saturationHeight = v < pickerProperties.saturationHeight + margin ? v - margin : pickerProperties.saturationHeight;
            }
            if (pickerProperties.saturationHeight < 50) pickerProperties.saturationHeight=50;
            v = dimensions.width;
            margin=70;
            if (v) {
                pickerProperties.saturationWidth = v < pickerProperties.saturationWidth + margin ? v - margin : pickerProperties.saturationWidth;
            }
            if (pickerProperties.saturationWidth < 50 ) pickerProperties.saturationWidth=50;
            return (
                <div className="settingsDialog colorDialog">
                    <h3><span >{item.label}</span></h3>
                    <ColorPicker value={this.state.value} onDrag={this.onDrag} {...pickerProperties}/>
                    <div className="colorFrame">
                        <div style={style} className="colorValue"></div>
                        <input className="colorName"
                               onChange={this.colorInput}
                               value={this.state.value}/>
                    </div>
                    <button name="ok" onClick={this.buttonClick}>OK</button>
                    <button name="cancel" onClick={this.buttonClick}>Cancel</button>
                    <button name="reset" onClick={this.buttonClick}>Reset</button>
                    <div className="clear"></div>
                </div>
            );
        }

    };
    OverlayDialog.dialog(Dialog);
};



const ColorSettingsItem=(properties)=>{
    let style={
        backgroundColor: properties.value
    };

    return <div className={properties.lassName+ " listEntry colorSelector"}
                onClick={function(ev){
                            colorItemDialog(properties);
                        }}>
        <div className="label">{properties.label}</div>
        <div className="colorValue" style={style}></div><div className="value">{properties.value}</div>
    </div>;
};

const createSettingsItem=(item)=>{
    if (item.type == PropertyType.CHECKBOX){
        return CheckBoxSettingsItem;
    }
    if (item.type == PropertyType.RANGE){
        return RangeSettingsItem;
    }
    if (item.type == PropertyType.COLOR){
        return ColorSettingsItem;
    }
    return (props)=>{
        return (<div className="listEntry">
            <div className="label">{props.label}</div>
            <div className="value">{props.value}</div>
        </div>)
    }
};

class SettingsPage extends React.Component{
    constructor(props){
        super(props);
        let self=this;
        this.buttons=[
            {
                name:'SettingsOK',
                onClick:()=>{
                    if (! self.leftPanelVisible()){
                        self.handlePanel(undefined);
                        return;
                    }
                    if (!self.hasChanges()){
                        history.pop();
                        return;
                    }
                    let values=globalStore.getData(keys.gui.settingspage.values);
                    globalStore.storeMultiple(values);
                    history.pop();
                }
            },
            {
                name: 'SettingsDefaults',
                onClick:()=> {
                    confirmAbortOrDo().then(()=> {
                        self.resetData();
                    });
                }
            },
            {
                name:'SettingsAndroid',
                visible: globalStore.getData(keys.gui.global.onAndroid,false),
                onClick:()=>{
                    confirmAbortOrDo().then(()=> {
                        history.pop();
                        avnav.android.showSettings();
                    });
                }
            },
            {
                name: 'Cancel',
                onClick: ()=>{
                    if (! self.leftPanelVisible()){
                        self.handlePanel(undefined);
                        return;
                    }
                    confirmAbortOrDo().then(()=> {
                    history.pop();
                });
                }
            }
        ];
        this.state={};
        this.changeItem=this.changeItem.bind(this);
        this.resetData=this.resetData.bind(this);
        this.hasChanges=this.hasChanges.bind(this);
        this.leftPanelVisible=this.leftPanelVisible.bind(this);
        this.handlePanel=this.handlePanel.bind(this);
        this.sectionClick=this.sectionClick.bind(this);
        this.flattenedKeys=KeyHelper.flattenedKeys(keys.properties);
        globalStore.storeData(keys.gui.settingspage.leftPanelVisible,true);
        this.leftVisible=true;
        let values=globalStore.getMultiple(this.flattenedKeys);
        globalStore.storeData(keys.gui.settingspage.values,values);
        globalStore.storeData(keys.gui.settingspage.hasChanges,false);
        globalStore.storeData(keys.gui.settingspage.section,'Layer');

    }
    resetData(){
        let values=assign({},globalStore.getData(keys.gui.settingspage.values));
        let hasChanges=false;
        this.flattenedKeys.forEach((key)=>{
            let description=KeyHelper.getKeyDescriptions()[key];
            if (description){
                if (values[key] !== description.defaultv) {
                    hasChanges=true;
                    values[key] = description.defaultv;
                }
            }
        });
        globalStore.storeData(keys.gui.settingspage.values,values);
        globalStore.storeData(keys.gui.settingspage.hasChanges,hasChanges);
    }
    hasChanges(){
        return globalStore.getData(keys.gui.settingspage.hasChanges);
    }
    changeItem(item,value){
        let old=globalStore.getData(keys.gui.settingspage.values,{});
        let hasChanged=old[item.name]!== value;
        if (hasChanged){
            let changed={};
            changed[item.name]=value;
            globalStore.storeData(keys.gui.settingspage.values,assign({},old,changed));
            globalStore.storeData(keys.gui.settingspage.hasChanges,true);
        }
    }
    leftPanelVisible(){
        return this.leftVisible;
    }
    handlePanel(section){
        if (section === undefined){
            globalStore.storeData(keys.gui.settingspage.leftPanelVisible,true);
        }
        else {
            globalStore.storeData(keys.gui.settingspage.section, section);
            globalStore.storeData(keys.gui.settingspage.leftPanelVisible,false);
        }
    }
    sectionClick(item){
        this.handlePanel(item.name);
    }
    componentDidMount(){
    }
    render(){
        let self=this;
        let small=globalStore.getData(keys.gui.global.windowDimensions,{}).width
            < globalStore.getData(keys.properties.smallBreak);
        let leftVisible=!small || globalStore.getData(keys.gui.settingspage.leftPanelVisible);
        let rightVisible=!small || ! globalStore.getData(keys.gui.settingspage.leftPanelVisible);
        let MainContent=(props)=> {
            let small=globalStore.getData(keys.gui.global.windowDimensions,{}).width
                < globalStore.getData(keys.properties.smallBreak);
            let leftVisible=!small || props.leftPanelVisible;
            this.leftVisible=leftVisible; //intentionally no state - but we exactly need to know how this looked at the last render
            let rightVisible=!small || ! props.leftPanelVisible;
            let leftClass="sectionList";
            if (! rightVisible) leftClass+=" expand";
            let currentSection=globalStore.getData(keys.gui.settingspage.section,'Layer');
            let sectionItems=[];
            for (let s in settingsSections){
                let item={name:s};
                if (s === currentSection) item.activeItem=true;
                sectionItems.push(item);
            }
            let settingsItems=[];
            if (settingsSections[currentSection]) {
                for (let s in settingsSections[currentSection]){
                    let key=settingsSections[currentSection][s];
                    let description=KeyHelper.getKeyDescriptions()[key];
                    let item=assign({},description,{
                        name: key,
                        value:props.values[key]});
                    settingsItems.push(item);
                }
            }
            return (
                <div className="leftSection">
                    { leftVisible?<ItemList
                        className={leftClass}
                        scrollable={true}
                        itemClass={SectionItem}
                        onItemClick={self.sectionClick}
                        itemList={sectionItems}
                        />:null}
                    {rightVisible ? <ItemList
                        className="settingsList"
                        scrollable={true}
                        itemCreator={createSettingsItem}
                        itemList={settingsItems}
                        onItemClick={self.changeItem}
                        />:null}
                </div>);
        };
        let DynamicMain=Dynamic(MainContent);
        return (
            <Page
                className={this.props.className}
                style={this.props.style}
                id="settingspage"
                title="Settings"
                mainContent={
                            <DynamicMain
                                storeKeys={{
                                    leftPanelVisible:keys.gui.settingspage.leftPanelVisible,
                                    section:keys.gui.settingspage.section,
                                    values:keys.gui.settingspage.values
                                }}
                            />
                        }
                buttonList={self.buttons}/>
        );
    }
}

module.exports=SettingsPage;
