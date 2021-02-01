import "./App.css";

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import 'firebase/analytics';


// Hooks
import React, { useRef, useState} from 'react';
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

const stc = require('string-to-color');

var firebaseConfig = {
  apiKey: "AIzaSyC-_2lgV0vNeVOe6cpDJ9c_xLo85QhpPxg",
  authDomain: "onlinesgbridge.firebaseapp.com",
  projectId: "onlinesgbridge",
  storageBucket: "onlinesgbridge.appspot.com",
  messagingSenderId: "338515223390",
  appId: "1:338515223390:web:55d9fd31c0977a2f6425cf",
  measurementId: "G-HGEQPFX11X",
}

firebase.initializeApp(firebaseConfig);

// Code below required to prevent reinitialisation of
// firebase app with same config (which is not allowed) during hot reload
if (firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const analytics = firebase.analytics();



function App() {

  const [user,loading, error] = useAuthState(auth);
  
  //const UserContext = createContext(user);
  return (
    <div className="App">
      <header>
        <SignOut />
      </header>

      <section>
        {user ? <Profile /> : <></>}
        {user ? <MainChat /> : <SignIn />}
        
      </section>
    </div>
  );
}

// 'SignIn' functional component
function SignIn() {
  const handleSignInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
      console.log(`Succesfully signed in with Google as ${result.user[1]}`)
    }).catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(`Error Signing in with Google.
       errorCode: ${errorCode}
       errorMessage: ${errorMessage}`)
    });
  }
  const assignDisplayName = (inputName = null) => {
    let user = firebase.auth().currentUser
      user.updateProfile({
      displayName: inputName + ' (Guest)',
      photoURL: "https://icon-library.com/images/no-user-image-icon/no-user-image-icon-26.jpg"
    }).then(function() {
      console.log(`Successfully assigned ${auth.currentUser.uid}'s displayName as ${auth.currentUser.displayName}`);
    }).catch(function(error) {
      var errorCode = error.code;
        var errorMessage = error.message;
        console.log(`Assigning displayName to ${auth.currentUser.uid}.
       errorCode: ${errorCode}
       errorMessage: ${errorMessage}`);
    });
  }

  const handleSignInAsGuest = (inputName = null) => {
    //e.preventDefault()
    firebase
      .auth()
      .signInAnonymously()
      .then(() => {
        assignDisplayName(inputName)
      }).then(()=>{
        console.log("Succesfully signed in as Guest");
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(`Error signing in as Guest.
       errorCode: ${errorCode}
       errorMessage: ${errorMessage}`);
      });
  };
 const [guestName, setguestName] = useState('');

 const handleSubmit = (e) => {
  e.preventDefault();
  handleSignInAsGuest(guestName)
}

  return (
    <div>
      <button onClick={handleSignInWithGoogle}>Sign in with Google</button>
      <form onSubmit={handleSubmit}>
        <input value={guestName} onChange={(e) => setguestName(e.target.value)} />
        <button type='submit' disabled={!guestName}>Sign in as Guest</button>
      </form>
    </div>
  );
}

function SignOut() {
  const handleSignOut = () => {
    auth.signOut().then(() => {
      console.log('Succesfully signed out')
    }).catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(`Error signing out.
       errorCode: ${errorCode}
       errorMessage: ${errorMessage}`)
    });
  }

  return auth.currentUser && (
    <button onClick={handleSignOut}>Sign Out</button>
  )
}
function Profile() {
  const [displayName, setDisplayName] = useState("Loading...");
  const [photoURL, setphotoURL] = useState(null);
  const user = firebase.auth().currentUser;
  const uid = user.uid
  user.reload().then(() => {
    const refreshUser = firebase.auth().currentUser;
    setDisplayName(refreshUser.displayName)
    setphotoURL(refreshUser.photoURL)
  })
  //const { uid, photoURL, displayName} = auth.currentUser;
  return(
    <>
      <img alt={`photoURL${photoURL}`} src={photoURL || 'https://icon-library.com/images/no-user-image-icon/no-user-image-icon-26.jpg'} />
      <span>Signed in as <span style={{color : stc(uid), textShadow:"1px 1px 2px #000000"}}>{displayName}</span></span>
    </>
  )
}

function MainChat() {
  //Not sure what this dummy ref thing does. Need to investigate further
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy("createdAt").limitToLast(30);

  //hooks (analogous to setState)
  const [messages] = useCollectionData(query, {idField:'id'});
  const [formValue, setFormValue] = useState('');

  const sendMessage = async(e) => {
    // Stops form from refreshing page on submit,
    // which is the default behaviour.
    e.preventDefault();

    const { uid, photoURL, displayName} = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
      displayName
    })
    //console.log(auth.currentUser)
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <main>
        {messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} />
        <button type='submit' disabled={!formValue}>Send Message</button>
      </form>
    </>
  )
}


function ChatMessage(props) {
  const {text, uid, photoURL, displayName} = props.message;

  // check if msg is sent or received by comparing uid
  // can be used to apply CSS styling conditionally
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';
  const isYou = uid === auth.currentUser.uid ? '(You)' : '';

  return (
  <div className={`message ${messageClass}`}>
    <img alt={`photoURL${photoURL}`} src={photoURL || 'https://icon-library.com/images/no-user-image-icon/no-user-image-icon-26.jpg'} />
    <p className='messageP' style={{color : stc(uid), textShadow:"1px 1px 2px #000000"}}>{displayName} {isYou}</p><p className='messageP'>: {text}</p>
  </div>

  )
}

export default App;
