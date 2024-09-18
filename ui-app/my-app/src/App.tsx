import React, { useContext, useEffect } from 'react';
import LoginForm from "./components/LoginForm";
import { Context } from './index';
import { observer } from 'mobx-react-lite';

function App() {
    const {store} = useContext(Context);

  useEffect(() => {
      if (localStorage.getItem('token')) {
          store.checkAuth();
      }
  }, []);

  return (
    <div className="App">
        <h1>{store.isAuth ? `Customer is registered ${store.user?.email}` : 'Please authorize'}</h1>
        {store.isAuth ? (
            <button >Logout</button>
        ) : (
            <LoginForm />
        )}
    </div>
  );
}

export default observer(App);
