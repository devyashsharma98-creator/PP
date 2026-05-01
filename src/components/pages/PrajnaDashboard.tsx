"use client";

import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  Plus,
  UserPlus,
  Users,
} from "lucide-react";

import { DashboardCard } from "@/components/DashboardCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type Task = {
  id: number;
  title: string;
  owner: string;
  done: boolean;
};

const stats = [
  {
    title: "इस महीने मेरे कार्यक्रम",
    value: "12",
    helper: "3 समीक्षा के लिए बाकी हैं",
    icon: CalendarDays,
    tone: "saffron" as const,
  },
  {
    title: "बाकी कार्य",
    value: "8",
    helper: "2 आज पूरे करने हैं",
    icon: ClipboardCheck,
    tone: "blue" as const,
  },
  {
    title: "मेरे विश्वविद्यालय केंद्र",
    value: "6",
    helper: "4 इस सप्ताह सक्रिय हैं",
    icon: BookOpenCheck,
    tone: "green" as const,
  },
  {
    title: "कुल सदस्य",
    value: "248",
    helper: "भोपाल क्षेत्र में",
    icon: Users,
    tone: "slate" as const,
  },
];

const upcomingEvents = [
  {
    title: "विश्वविद्यालय समूह चर्चा",
    date: "2 मई",
    time: "सुबह 10:30",
    venue: "BU भोपाल सेमिनार हॉल",
  },
  {
    title: "SHE Talk योजना बैठक",
    date: "4 मई",
    time: "शाम 5:00",
    venue: "रवीन्द्र भवन",
  },
  {
    title: "युवा स्वयंसेवक परिचय सत्र",
    date: "7 मई",
    time: "सुबह 11:00",
    venue: "LNCT परिसर",
  },
];

const initialTasks: Task[] = [
  { id: 1, title: "SHE Talk के वक्ता की पुष्टि करें", owner: "अंजली वर्मा", done: false },
  { id: 2, title: "नए स्वयंसेवकों की सूची स्वीकृत करें", owner: "राघव शर्मा", done: false },
  { id: 3, title: "केंद्र प्रमुखों को स्थान की जानकारी भेजें", owner: "नेहा जोशी", done: true },
  { id: 4, title: "मई केंद्र रिपोर्ट की समीक्षा करें", owner: "अमित तिवारी", done: false },
];

const recentActivities = [
  "अंजली वर्मा ने बरकतुल्लाह विश्वविद्यालय केंद्र में 14 सदस्य जोड़े।",
  "नेहा जोशी ने SHE Talk कार्यक्रम समीक्षा के लिए भेजा।",
  "अमित तिवारी ने युवा परिचय सत्र की उपस्थिति पूरी की।",
  "राघव शर्मा ने केंद्र समन्वयक बदलाव स्वीकृत किए।",
  "वित्त टीम ने अप्रैल खर्च सारांश अपलोड किया।",
];

const quickActions = [
  { label: "नया कार्यक्रम बनाएं", icon: Plus },
  { label: "नया सदस्य जोड़ें", icon: UserPlus },
  { label: "केंद्र प्रदर्शन देखें", icon: LayoutDashboard },
];

export function PrajnaDashboard() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const completedTasks = useMemo(() => tasks.filter((task) => task.done).length, [tasks]);

  function logAction(action: string) {
    console.log(`[Prajna ERP Dashboard] ${action}`);
  }

  function toggleTask(taskId: number) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    );
    logAction(`Task ${taskId} toggled`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-slate-950 font-devanagari">
      <div className="space-y-6 pb-4">
        <section className="rounded-[1.75rem] bg-[#fff3df] p-5 shadow-sm ring-1 ring-orange-100 sm:p-6 lg:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_23rem] lg:items-center">
            <div className="space-y-3">
              <Badge className="rounded-full bg-orange-500 px-3 py-1 text-white hover:bg-orange-500">
                आज की प्राथमिकता
              </Badge>
              <h1 className="text-3xl font-semibold text-blue-950 sm:text-4xl">आज की प्राथमिकता</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-700">
                भोपाल के विश्वविद्यालय केंद्रों की रिपोर्ट देखें और अगले सप्ताह के कार्यक्रम की पुष्टि करें।
              </p>
            </div>

            <Card className="border-orange-200 bg-white shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">सबसे जरूरी कार्य</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-950">
                      3 केंद्र रिपोर्ट स्वीकृत करें
                    </h2>
                  </div>
                  <Badge variant="outline" className="rounded-full border-orange-200 text-orange-700">
                    आज अंतिम दिन
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  बरकतुल्लाह विश्वविद्यालय, LNCT और MANIT ने साप्ताहिक अपडेट समीक्षा के लिए भेजे हैं।
                </p>
                <Button
                  type="button"
                  onClick={() => logAction("Today priority action clicked")}
                  className="h-12 w-full rounded-full bg-blue-950 text-white hover:bg-blue-900"
                >
                  अभी कार्य करें
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <DashboardCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              helper={stat.helper}
              icon={stat.icon}
              tone={stat.tone}
              onClick={() => logAction(`${stat.title} card clicked`)}
            />
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl text-slate-950">आने वाले कार्यक्रम</CardTitle>
                <p className="mt-1 text-sm text-slate-500">अगले 7 दिन</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => logAction("All events opened")}
                className="rounded-full border-slate-200"
              >
                सभी देखें
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event) => (
                <button
                  key={event.title}
                  type="button"
                  onClick={() => logAction(`${event.title} opened`)}
                  className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex gap-3">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-blue-950 ring-1 ring-slate-200">
                      <span className="text-xs font-medium">{event.date.split(" ")[0]}</span>
                      <span className="text-lg font-semibold">{event.date.split(" ")[1]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-950">{event.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{event.venue}</p>
                      <p className="text-sm text-slate-500">{event.time}</p>
                    </div>
                  </div>
                  <span className="inline-flex rounded-full bg-blue-950 px-4 py-2 text-sm font-medium text-white">
                    खोलें
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-4">
              <div>
                <CardTitle className="text-xl text-slate-950">मेरे कार्य</CardTitle>
                <p className="mt-1 text-sm text-slate-500">
                  {tasks.length} में से {completedTasks} पूरे
                </p>
              </div>
              <Badge className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                इस सप्ताह
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1 border-slate-300 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                    aria-label={`${task.title} पूरा चिह्नित करें`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={task.done ? "font-medium text-slate-400 line-through" : "font-medium text-slate-950"}>
                      {task.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">उत्तरदायी: {task.owner}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">त्वरित कार्य</h2>
              <p className="mt-1 text-sm text-slate-500">सामान्य काम एक क्लिक में</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant="outline"
                onClick={() => logAction(`${action.label} clicked`)}
                className="h-14 justify-start rounded-2xl border-slate-200 bg-white px-5 text-base font-semibold text-slate-950 shadow-sm transition hover:border-orange-200 hover:bg-orange-50"
              >
                <action.icon className="h-5 w-5 text-orange-600" />
                {action.label}
              </Button>
            ))}
          </div>
        </section>

        <section>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-950">हाल की गतिविधि</CardTitle>
              <p className="text-sm text-slate-500">आपके क्षेत्र के नए अपडेट</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => logAction(`Recent activity ${index + 1} clicked`)}
                    className="flex w-full gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-50"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium leading-6 text-slate-800">{activity}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {index + 1} घंटे पहले
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

    </div>
  );
}
