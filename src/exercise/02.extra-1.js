// useCallback: custom hooks
// http://localhost:3000/isolated/exercise/02.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonForm,
  PokemonDataView,
  PokemonInfoFallback,
  PokemonErrorBoundary,
} from '../pokemon'

// 🐨 this is going to be our generic asyncReducer
function reducer(state, action) {
  switch (action.type) {
    case 'pending': {
      // 🐨 replace "pokemon" with "data"
      return {status: 'pending', data: null, error: null}
    }
    case 'resolved': {
      // 🐨 replace "pokemon" with "data" (in the action too!)
      return {status: 'resolved', data: action.data, error: null}
    }
    case 'rejected': {
      // 🐨 replace "pokemon" with "data"
      return {status: 'rejected', data: null, error: action.error}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

const useAsync = (asyncCallback, initialStatus) => {
  const [state, dispatch] = React.useReducer(reducer, {
    data: null,
    error: null,
    status: 'idle',
    ...initialStatus,
  })

  React.useEffect(() => {
    // 💰  first early-exit
    // then you can dispatch and handle the promise etc...
    const promise = asyncCallback();
    if(!promise) {
      return;
    }

    dispatch({type: 'pending'})
    promise.then(
      data => {
        dispatch({type: 'resolved', data})
      },
      error => {
        dispatch({type: 'rejected', error})
      },
    )
  }, [asyncCallback])

  return state;
}

function PokemonInfo({pokemonName}) {
  // If I don't use useCallback here and use asyncCallback as dependency to the
  // useEffect of the useAsync custom hook, asyncCallback will be redefined in
  // every render and will cause useEffect to be triggered infinitely because
  // the dependency will always be different, even if pokemonName does not change.
  const asyncCallback = React.useCallback(
    () => {
      if(!pokemonName) {
        return
      }
      return fetchPokemon(pokemonName)
    },
    [pokemonName]
  );
  // So useCallback will always return use the same function with pokemonName in
  // its closure, until pokemonName. In that case, useCallback will return us a
  // new function (different from what it was returning before) with a new
  // new pokemonName in its closure.

  
  const state = useAsync(
    asyncCallback,
    { status: pokemonName ? 'pending' : 'idle'}
  );

  const {data, status, error} = state

  if (status === 'idle' || !pokemonName) {
    return 'Submit a pokemon'
  } else if (status === 'pending') {
    return <PokemonInfoFallback name={pokemonName} />
  } else if (status === 'rejected') {
    throw error
  } else if (status === 'resolved') {
    return <PokemonDataView pokemon={data} />
  }

  throw new Error('This should be impossible')
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className="pokemon-info">
        <PokemonErrorBoundary onReset={handleReset} resetKeys={[pokemonName]}>
          <PokemonInfo pokemonName={pokemonName} />
        </PokemonErrorBoundary>
      </div>
    </div>
  )
}

function AppWithUnmountCheckbox() {
  const [mountApp, setMountApp] = React.useState(true)
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={mountApp}
          onChange={e => setMountApp(e.target.checked)}
        />{' '}
        Mount Component
      </label>
      <hr />
      {mountApp ? <App /> : null}
    </div>
  )
}

export default AppWithUnmountCheckbox
