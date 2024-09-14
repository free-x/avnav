/**
 * Created by andreas on 23.02.16.
 */

import React from "react";
import {WidgetFrame, WidgetProps} from "./WidgetBase";

const UndefinedWidget=(props)=>{
    let classes="undefinedWidget";
    return (
        <WidgetFrame {...props} className={classes} caption="Undefined Widget">
            <div className='widgetData'>
                {props.name}
            </div>
        </WidgetFrame>
        );
    }

UndefinedWidget.propTypes={
    ...WidgetProps
};


export default UndefinedWidget;