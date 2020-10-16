import React, { useEffect, useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/webpack-resolver';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-monokai';
import { useLocation } from 'react-router-dom';

export default function Logs(){
  const [log, setLog] = useState('');

  let location = useLocation();

  useEffect(() => {
    window.api.getPodLogs(location.pathname).then(res => {
      setLog(res);
    })
  }, [])

  return(
    <div aria-label={'log-editor'}>
      <AceEditor
        mode={'markdown'}
        theme="monokai"
        fontSize={16}
        value={log}
        readOnly
        highlightActiveLine
        showLineNumbers
        tabSize={2}
        height={'72vh'}
        width={'auto'}
      />
    </div>
  )
}
