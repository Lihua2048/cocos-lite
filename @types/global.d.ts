/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-native" />

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
  }
}

export {};
