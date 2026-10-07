import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  View
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { Exam, Result } from "./src/types";
import { sampleExam } from "./src/sampleExam";
import { parsePlainText } from "./src/parser";

type Screen = "home" | "create" | "exam" | "result" | "history" | "settings";

const colors = {
  bg: "#070B14", card: "#111827", card2: "#172033", text: "#F8FAFC",
  muted: "#94A3B8", accent: "#8B5CF6", accent2: "#A78BFA",
  border: "#263247", danger: "#F87171", success: "#34D399"
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [exam, setExam] = useState<Exam>(sampleExam);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(sampleExam.durationMinutes * 60);

  useEffect(() => {
    if (screen !== "exam") return;
    if (secondsLeft <= 0) { finishExam(); return; }
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [screen, secondsLeft]);

  const startExam = (e: Exam) => {
    setExam(e);
    setAnswers({});
    setCurrent(0);
    setSecondsLeft(e.durationMinutes * 60);
    setScreen("exam");
  };

  const finishExam = () => {
    const attempted = Object.keys(answers).length;
    let correct = 0, wrong = 0;
    exam.questions.forEach(q => {
      if (answers[q.id] === undefined) return;
      if (q.correctIndex !== undefined && answers[q.id] === q.correctIndex) correct++;
      else wrong++;
    });
    const unattempted = exam.questions.length - attempted;
    const score = correct * exam.positiveMarks - wrong * exam.negativeMarks;
    const maxScore = exam.questions.length * exam.positiveMarks;
    const r: Result = {
      examTitle: exam.title, score, maxScore, attempted, correct, wrong,
      unattempted, accuracy: attempted ? Math.round((correct / attempted) * 100) : 0
    };
    setResult(r);
    setHistory(h => [r, ...h]);
    setScreen("result");
  };

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      {screen === "home" && <Home onCreate={() => setScreen("create")} onStart={() => startExam(sampleExam)} onHistory={() => setScreen("history")} onSettings={() => setScreen("settings")} />}
      {screen === "create" && <Create onBack={() => setScreen("home")} onStart={startExam} />}
      {screen === "exam" && (
        <ExamScreen
          exam={exam} answers={answers} setAnswers={setAnswers} current={current}
          setCurrent={setCurrent} minutes={minutes} seconds={seconds}
          onSubmit={() => Alert.alert("Submit exam?", "Your answers will be evaluated.", [
            {text: "Cancel"}, {text: "Submit", style: "destructive", onPress: finishExam}
          ])}
        />
      )}
      {screen === "result" && <ResultScreen result={result!} onHome={() => setScreen("home")} />}
      {screen === "history" && <History history={history} onBack={() => setScreen("home")} />}
      {screen === "settings" && <Settings onBack={() => setScreen("home")} />}
    </SafeAreaView>
  );
}

function Header({title, onBack}:{title:string; onBack?:()=>void}) {
  return <View style={styles.header}>
    {onBack ? <Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable> : <View style={{width:40}} />}
    <Text style={styles.headerTitle}>{title}</Text><View style={{width:40}} />
  </View>;
}

function Home({onCreate,onStart,onHistory,onSettings}:{onCreate:()=>void;onStart:()=>void;onHistory:()=>void;onSettings:()=>void}) {
  return <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.hero}>
      <Text style={styles.brand}>VARSSITY</Text>
      <Text style={styles.heroTitle}>EXAMS</Text>
      <Text style={styles.founder}>Founder: THILAK</Text>
      <Text style={styles.tagline}>NEET • JEE • EAPCET • CUSTOM</Text>
    </View>
    <View style={styles.grid}>
      <Action title="Start Demo Exam" sub="CBT practice with timer" onPress={onStart} />
      <Action title="Create Exam" sub="Import paper / build test" onPress={onCreate} />
      <Action title="Exam History" sub="View your result memo" onPress={onHistory} />
      <Action title="Settings" sub="Backend and app options" onPress={onSettings} />
    </View>
    <View style={styles.info}>
      <Text style={styles.infoTitle}>Cloud-build edition</Text>
      <Text style={styles.infoText}>This version is prepared for Expo EAS cloud builds. No Android Studio is required to create the APK.</Text>
    </View>
  </ScrollView>;
}

function Action({title,sub,onPress}:{title:string;sub:string;onPress:()=>void}) {
  return <Pressable onPress={onPress} style={({pressed})=>[styles.action,{opacity:pressed?.75:1}]}>
    <Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{sub}</Text>
  </Pressable>;
}

function Create({onBack,onStart}:{onBack:()=>void;onStart:(e:Exam)=>void}) {
  const [title,setTitle]=useState("My Practice Exam");
  const [type,setType]=useState("NEET");
  const [duration,setDuration]=useState("60");
  const [positive,setPositive]=useState("4");
  const [negative,setNegative]=useState("1");
  const [raw,setRaw]=useState("");
  const [picked,setPicked]=useState("");
  const [questions,setQuestions]=useState(sampleExam.questions);

  const pickDocument = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf","image/*","text/plain","application/json"],
      copyToCacheDirectory: true
    });
    if (!r.canceled) {
      setPicked(r.assets[0].name);
      Alert.alert("File selected", `${r.assets[0].name}\n\nFor full PDF/JPG OCR + AI parsing, connect the backend described in BACKEND.md.`);
    }
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"], quality:1});
    if (!r.canceled) setPicked(r.assets[0].uri.split("/").pop() || "Image selected");
  };

  const importText = () => {
    if (!raw.trim()) return Alert.alert("Paste question paper text first.");
    const parsed = parsePlainText(raw, title, type);
    if (!parsed.questions.length) return Alert.alert("No questions detected", "Use format: 1. Question text, A. option, B. option...");
    setQuestions(parsed.questions);
    Alert.alert("Imported", `${parsed.questions.length} questions detected.`);
  };

  const create = () => {
    if (!questions.length) return Alert.alert("Add questions first.");
    onStart({
      id:"custom-"+Date.now(), title, type,
      durationMinutes: Math.max(1, Number(duration)||60),
      positiveMarks:Number(positive)||1, negativeMarks:Number(negative)||0,
      questions
    });
  };

  return <ScrollView contentContainerStyle={styles.container}>
    <Header title="Create Exam" onBack={onBack}/>
    <Text style={styles.label}>Exam title</Text>
    <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Exam title" placeholderTextColor={colors.muted}/>
    <Text style={styles.label}>Exam type</Text>
    <View style={styles.row}>{["NEET","JEE","EAPCET","CUSTOM"].map(x=><Pressable key={x} onPress={()=>setType(x)} style={[styles.chip,type===x&&styles.chipActive]}><Text style={styles.chipText}>{x}</Text></Pressable>)}</View>
    <View style={styles.row}>
      <Field label="Minutes" value={duration} set={setDuration}/>
      <Field label="+ Marks" value={positive} set={setPositive}/>
      <Field label="- Marks" value={negative} set={setNegative}/>
    </View>
    <Pressable style={styles.primary} onPress={pickDocument}><Text style={styles.primaryText}>📄 Choose JPG / PNG / PDF</Text></Pressable>
    <Pressable style={styles.secondary} onPress={pickImage}><Text style={styles.secondaryText}>🖼️ Choose image</Text></Pressable>
    {picked ? <Text style={styles.fileName}>Selected: {picked}</Text> : null}
    <Text style={styles.label}>Quick text import</Text>
    <Text style={styles.hint}>Example:{"\n"}1. Question text{"\n"}A. Option A{"\n"}B. Option B{"\n"}C. Option C{"\n"}D. Option D</Text>
    <TextInput value={raw} onChangeText={setRaw} multiline style={[styles.input,{height:150,textAlignVertical:"top"}]} placeholder="Paste extracted paper text here..." placeholderTextColor={colors.muted}/>
    <Pressable style={styles.secondary} onPress={importText}><Text style={styles.secondaryText}>Parse questions</Text></Pressable>
    <Text style={styles.questionCount}>{questions.length} questions ready</Text>
    <Pressable style={styles.primary} onPress={create}><Text style={styles.primaryText}>Start CBT Exam</Text></Pressable>
  </ScrollView>;
}

function Field({label,value,set}:{label:string;value:string;set:(x:string)=>void}) {
  return <View style={{flex:1,marginHorizontal:4}}><Text style={styles.smallLabel}>{label}</Text><TextInput keyboardType="numeric" value={value} onChangeText={set} style={styles.input}/></View>;
}

function ExamScreen({exam,answers,setAnswers,current,setCurrent,minutes,seconds,onSubmit}:{exam:Exam;answers:Record<string,number>;setAnswers:React.Dispatch<React.SetStateAction<Record<string,number>>>;current:number;setCurrent:(n:number)=>void;minutes:string;seconds:string;onSubmit:()=>void}) {
  const q=exam.questions[current];
  const answered=Object.keys(answers).length;
  return <View style={{flex:1}}>
    <Header title={exam.title}/>
    <View style={styles.examTop}><Text style={styles.timer}>⏱ {minutes}:{seconds}</Text><Text style={styles.progress}>{current+1}/{exam.questions.length} • {answered} answered</Text></View>
    <ScrollView contentContainerStyle={styles.examBody}>
      <Text style={styles.qNumber}>Question {current+1}</Text><Text style={styles.qText}>{q.text}</Text>
      {q.options.map((o,i)=><Pressable key={i} onPress={()=>setAnswers(a=>({...a,[q.id]:i}))} style={[styles.option,answers[q.id]===i&&styles.optionSelected]}>
        <View style={[styles.radio,answers[q.id]===i&&styles.radioSelected]}>{answers[q.id]===i&&<View style={styles.radioDot}/>}</View><Text style={styles.optionText}>{String.fromCharCode(65+i)}. {o}</Text>
      </Pressable>)}
    </ScrollView>
    <View style={styles.examNav}>
      <Pressable disabled={current===0} onPress={()=>setCurrent(Math.max(0,current-1))} style={[styles.navBtn,current===0&&styles.disabled]}><Text style={styles.navText}>Previous</Text></Pressable>
      {current<exam.questions.length-1
        ? <Pressable onPress={()=>setCurrent(current+1)} style={styles.navBtn}><Text style={styles.navText}>Next</Text></Pressable>
        : <Pressable onPress={onSubmit} style={[styles.navBtn,{backgroundColor:colors.success}]}><Text style={styles.navText}>Submit</Text></Pressable>}
    </View>
  </View>;
}

function ResultScreen({result,onHome}:{result:Result;onHome:()=>void}) {
  return <ScrollView contentContainerStyle={styles.container}>
    <Header title="Result"/>
    <View style={styles.resultHero}><Text style={styles.score}>{result.score}</Text><Text style={styles.scoreSub}>/ {result.maxScore} marks</Text></View>
    <View style={styles.stats}>{[
      ["Correct",result.correct,colors.success],["Wrong",result.wrong,colors.danger],["Unattempted",result.unattempted,colors.muted],["Accuracy",`${result.accuracy}%`,colors.accent2]
    ].map(([a,b,c])=><View key={String(a)} style={styles.stat}><Text style={styles.statValue}>{b}</Text><Text style={styles.statLabel}>{a}</Text></View>)}</View>
    <Pressable style={styles.primary} onPress={onHome}><Text style={styles.primaryText}>Back to Home</Text></Pressable>
  </ScrollView>;
}

function History({history,onBack}:{history:Result[];onBack:()=>void}) {
  return <ScrollView contentContainerStyle={styles.container}><Header title="Exam History" onBack={onBack}/>
    {history.length===0?<Text style={styles.empty}>No exams completed yet.</Text>:history.map((r,i)=><View key={i} style={styles.historyCard}><Text style={styles.actionTitle}>{r.examTitle}</Text><Text style={styles.actionSub}>Score {r.score}/{r.maxScore} • Correct {r.correct} • Wrong {r.wrong}</Text></View>)}
  </ScrollView>;
}

function Settings({onBack}:{onBack:()=>void}) {
  const [url,setUrl]=useState("");
  return <ScrollView contentContainerStyle={styles.container}><Header title="Settings" onBack={onBack}/>
    <Text style={styles.label}>AI / OCR backend URL</Text>
    <TextInput value={url} onChangeText={setUrl} style={styles.input} placeholder="https://your-backend.example.com" placeholderTextColor={colors.muted}/>
    <Text style={styles.hint}>Keep OpenAI API keys on the server. Never place an OpenAI key inside the APK.</Text>
    <View style={styles.info}><Text style={styles.infoTitle}>Cloud build</Text><Text style={styles.infoText}>Use the included eas.json preview profile to create an installable Android APK through EAS Build.</Text></View>
  </ScrollView>;
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg}, container:{padding:20,paddingBottom:40},
  hero:{paddingVertical:45,alignItems:"center"},brand:{fontSize:24,fontWeight:"900",letterSpacing:5,color:colors.accent2},
  heroTitle:{fontSize:48,fontWeight:"900",letterSpacing:2,color:colors.text},founder:{fontSize:16,color:colors.text,marginTop:8},tagline:{fontSize:12,color:colors.muted,marginTop:8},
  grid:{gap:12},action:{backgroundColor:colors.card,borderColor:colors.border,borderWidth:1,borderRadius:18,padding:20},
  actionTitle:{fontSize:18,fontWeight:"800",color:colors.text},actionSub:{fontSize:13,color:colors.muted,marginTop:5},
  info:{backgroundColor:colors.card2,borderRadius:16,padding:18,marginTop:20},infoTitle:{fontWeight:"800",color:colors.text,fontSize:16},infoText:{color:colors.muted,lineHeight:20,marginTop:6},
  header:{height:58,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:14,borderBottomWidth:1,borderBottomColor:colors.border},
  headerTitle:{color:colors.text,fontWeight:"800",fontSize:17},back:{width:40,height:40,justifyContent:"center"},backText:{fontSize:34,color:colors.text},
  label:{color:colors.text,fontWeight:"700",marginTop:18,marginBottom:8},smallLabel:{color:colors.muted,fontSize:12,marginBottom:5},
  input:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:12,color:colors.text,padding:13},
  row:{flexDirection:"row",marginVertical:6},chip:{paddingVertical:10,paddingHorizontal:12,borderRadius:20,borderWidth:1,borderColor:colors.border,marginRight:7},chipActive:{backgroundColor:colors.accent,borderColor:colors.accent},chipText:{color:colors.text,fontWeight:"700",fontSize:12},
  primary:{backgroundColor:colors.accent,padding:15,borderRadius:14,alignItems:"center",marginTop:14},primaryText:{color:"#fff",fontWeight:"800"},
  secondary:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,padding:14,borderRadius:14,alignItems:"center",marginTop:10},secondaryText:{color:colors.text,fontWeight:"700"},
  fileName:{color:colors.accent2,marginTop:8},hint:{color:colors.muted,lineHeight:20,marginTop:6},questionCount:{color:colors.success,fontWeight:"700",marginTop:12},
  examTop:{padding:14,backgroundColor:colors.card,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},timer:{color:colors.accent2,fontWeight:"900",fontSize:18},progress:{color:colors.muted},
  examBody:{padding:20},qNumber:{color:colors.accent2,fontWeight:"800"},qText:{color:colors.text,fontSize:21,lineHeight:30,fontWeight:"700",marginVertical:15},
  option:{flexDirection:"row",alignItems:"center",backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:15,marginBottom:10},optionSelected:{borderColor:colors.accent,backgroundColor:"#1D1630"},
  radio:{width:22,height:22,borderRadius:11,borderWidth:2,borderColor:colors.muted,marginRight:12,alignItems:"center",justifyContent:"center"},radioSelected:{borderColor:colors.accent2},radioDot:{width:10,height:10,borderRadius:5,backgroundColor:colors.accent2},
  optionText:{color:colors.text,flex:1,lineHeight:21},examNav:{flexDirection:"row",gap:10,padding:12,borderTopWidth:1,borderTopColor:colors.border},navBtn:{flex:1,backgroundColor:colors.accent,padding:14,borderRadius:12,alignItems:"center"},navText:{color:"#fff",fontWeight:"800"},disabled:{opacity:.35},
  resultHero:{alignItems:"center",paddingVertical:35},score:{fontSize:60,fontWeight:"900",color:colors.accent2},scoreSub:{color:colors.muted,fontSize:16},
  stats:{flexDirection:"row",flexWrap:"wrap",gap:10},stat:{width:"47%",backgroundColor:colors.card,borderRadius:16,padding:18},statValue:{color:colors.text,fontWeight:"900",fontSize:25},statLabel:{color:colors.muted,marginTop:4},
  historyCard:{backgroundColor:colors.card,padding:18,borderRadius:16,marginBottom:10},empty:{color:colors.muted,textAlign:"center",marginTop:50}
});
