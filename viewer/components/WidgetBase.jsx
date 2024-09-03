/**
 *###############################################################################
 # Copyright (c) 2012-2020 Andreas Vogel andreas@wellenvogel.net
 #
 #  Permission is hereby granted, free of charge, to any person obtaining a
 #  copy of this software and associated documentation files (the "Software"),
 #  to deal in the Software without restriction, including without limitation
 #  the rights to use, copy, modify, merge, publish, distribute, sublicense,
 #  and/or sell copies of the Software, and to permit persons to whom the
 #  Software is furnished to do so, subject to the following conditions:
 #
 #  The above copyright notice and this permission notice shall be included
 #  in all copies or substantial portions of the Software.
 #
 #  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 #  OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 #  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 #  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 #  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 #  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 #  DEALINGS IN THE SOFTWARE.
 #
 ###############################################################################
 Widget Base data
 */

import PropTypes from "prop-types";
import React from "react";

export const WidgetProps={
    onClick:    PropTypes.func,
    style:      PropTypes.object,
    className:  PropTypes.string,
    mode:       PropTypes.string, //display info side by side if small
    caption:    PropTypes.string
}

export const WidgetHead=(props)=> {
    if (props.unit === undefined && props.caption === undefined) return null;
    return (
    <div className="widgetHead">
        <div className='infoLeft'>{props.caption}</div>
        {props.unit !== undefined ?
            <div className='infoRight'>{props.unit}</div>
            : <div className='infoRight'></div>
        }
    </div>
    )
}

WidgetHead.propTypes={
    unit: PropTypes.string,
    caption: PropTypes.string
}