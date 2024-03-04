import Image from "next/image";
import PatientList from "@/_components/PatientList";

export default function Home() {

  return (
    <main className=" min-h-screen items-center justify-between p-20 bg-gray-100">
      <PatientList/>
    </main>
  );
}
