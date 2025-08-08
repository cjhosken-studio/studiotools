import { useState } from 'react'
import './App.css'
import NavigationBar from './components/NavigationBar'
import AppBar from './components/AppBar'
import { ContextProvider } from './data/context'

function App() {
  return (
    <div className='root'>
    <AppBar/>
    <div className='body'>
      <ContextProvider>
        <NavigationBar/>
        <div className='main'>
          sdfsdf
        </div>  
      </ContextProvider>
    </div>
    </div>
  )
}

export default App
