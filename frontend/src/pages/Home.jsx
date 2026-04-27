import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 lg:p-12">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-100 blur-2xl" />
      <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-emerald-100 blur-2xl" />

      <div className="relative mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold tracking-wide text-sky-700">
            Student Query Raiser Platform
          </div>

          <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Raise, Track, and Resolve Campus Issues Faster.
          </h1>

          <p className="text-sm leading-7 text-slate-600 sm:text-base">
            SmartCampus helps students submit queries for Wi-Fi, library,
            electrical, ERP, safety, and staff concerns with clear tracking,
            updates, and accountability.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/signup"
              className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Create Student Account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Login to Dashboard
            </Link>
          </div>

          <div className="grid gap-3 pt-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              Live status tracking
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              Supervisor assignment
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              Comment collaboration
            </div>
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-lg">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              1. Submit a detailed query with priority.
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              2. Supervisor gets assigned and starts action.
            </li>
            <li className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
              3. Follow comments and final resolution updates.
            </li>
          </ol>

          <p className="mt-5 text-xs text-slate-400">
            Smart Campus College Management Application
          </p>
        </div>
      </div>
    </section>
  );
}

export default Home;
