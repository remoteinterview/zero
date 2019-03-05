import * as React from "react";
import moment from 'moment';

export default class HelloWorld extends React.Component<{}, {}> {
   render() {
      return (
      <div>
         <b>Hello TypeScript</b>
         <p>Time: {moment().format('LT')}</p>
      </div>);
   }
}
