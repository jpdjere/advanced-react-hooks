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

const useSafeDispatch = (unsafeDispatch) => {
  // B2. Create a wrapper function for unsafeDispatch with useCallback, passing down 
  // all arguments as provided. No dependencies are required because unsafeDispatch
  // is stable, as it is being returned by useReducer.
  const dispatch = React.useCallback((...args) => {
    // 6. Check if the component is mounted to know if it safe to called dispatch.
    if(mountedRef.current) {
      unsafeDispatch(...args)
    }
    // A2. Now React can't understand that unsafeDispatch is coming from useReducer
    // so we'll have to add it to the dependencies array.
  }, [unsafeDispatch])
  // B3. Now we have to make sure that this function is not fired if our component
  // has been unmounted.

  // B4. For that we'll create a mountedRef value using useRef with an initial
  // value of false.
  const mountedRef = React.useRef(false);

  // B5. Now we'll set that value to true when the component is actually mounted.
  // On top of that, we'll return a cleanup function that will get called when 
  // the component is unmounted so we set the value to false.

  // A4. This should actually be useLayoutEffect to ensure that the function is called
  // as soon as the component is mounted, before the browser paints to the screen.
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    }
  })
  return dispatch;
}

const useAsync = (initialStatus) => {
  // B1. Rename dispatch to unsafeDispatch as it is unsafe: might cause an error
  // if component is unmounted before a dispatch is executed. This unsafe dispatch
  // will trigger a re-render even if the component is not mounted.
  const [state, unsafeDispatch] = React.useReducer(reducer, {
    data: null,
    error: null,
    status: 'idle',
    ...initialStatus,
  })

  // A1. Get our dispatch function from our customHook useSafeDispatch
  const dispatch = useSafeDispatch(unsafeDispatch);

  const run = React.useCallback(
    promise => {
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
    },
    // A5. We need to add dispatch to the deps array for the same reason: now
    // React doesn't know it is being created from useReducer, and thus remains
    // invariable.
    [dispatch]
  );


  return {...state, run};
}

function PokemonInfo({pokemonName}) {
  const {data, status, error, run} = useAsync({
    status: pokemonName ? 'pending' : 'idle',
  })

  React.useEffect(() => {
    if (!pokemonName) {
      return
    }
    run(fetchPokemon(pokemonName))
  }, [pokemonName, run])

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
