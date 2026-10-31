"use client";
import BottomNav from "@/components/BottomNav";

const stakingTable = [
  { deposit: "20,000", daily: "1,000", monthly: "30,000", total6: "180,000", profit: "160,000" },
  { deposit: "36,000", daily: "1,500", monthly: "45,000", total6: "270,000", profit: "234,000" },
  { deposit: "50,000", daily: "1,700", monthly: "51,000", total6: "306,000", profit: "256,000" },
  { deposit: "100,000", daily: "2,500", monthly: "75,000", total6: "450,000", profit: "350,000" },
  { deposit: "180,000", daily: "3,000", monthly: "90,000", total6: "540,000", profit: "360,000" },
  { deposit: "250,000", daily: "3,500", monthly: "105,000", total6: "630,000", profit: "380,000" },
  { deposit: "350,000", daily: "4,500", monthly: "135,000", total6: "810,000", profit: "460,000" },
  { deposit: "500,000", daily: "5,800", monthly: "174,000", total6: "1,044,000", profit: "544,000" },
  { deposit: "780,000", daily: "8,000", monthly: "240,000", total6: "1,440,000", profit: "660,000" },
  { deposit: "980,000", daily: "10,000", monthly: "300,000", total6: "1,800,000", profit: "820,000" },
  { deposit: "1,500,000", daily: "14,000", monthly: "420,000", total6: "2,520,000", profit: "1,020,000" },
  { deposit: "3,000,000", daily: "26,000", monthly: "780,000", total6: "4,680,000", profit: "1,680,000" },
  { deposit: "5,000,000", daily: "40,000", monthly: "1,200,000", total6: "7,200,000", profit: "2,200,000" },
];

const salaryTable = [
  { salary: "30,000", stakeWorth: "100,000+", team: "6+", teamType: "ABC", teamStake: "150,000+" },
  { salary: "50,000", stakeWorth: "200,000+", team: "10+", teamType: "ABC", teamStake: "300,000+" },
  { salary: "150,000", stakeWorth: "400,000+", team: "25+", teamType: "ABC", teamStake: "600,000" },
  { salary: "300,000", stakeWorth: "1,000,000+", team: "35+", teamType: "ABC", teamStake: "2,000,000+" },
  { salary: "800,000", stakeWorth: "2,500,000+", team: "60+", teamType: "ABC", teamStake: "3,000,000+" },
  { salary: "1,500,000", stakeWorth: "5,000,000+", team: "120", teamType: "ABC", teamStake: "9,000,000+" },
];

export default function SalaryPage() {
  return (
    <>
      <div className="min-h-screen bg-[#101319] pb-[120px]">
        <div className="bg-black py-4 px-4">
          <h1 className="text-center text-[#EBA043] text-[26px] font-black tracking-wide">SALARY</h1>
        </div>

        <div className="mx-3 mt-4">
          <div className="bg-[#EBA043] rounded-[12px] py-3 px-4">
            <h2 className="text-center text-black text-[15px] font-black">Daily staking salary table</h2>
          </div>

          <div className="mt-4 rounded-[14px] overflow-hidden border border-white/10 bg-[#1A1E2A]">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#EBA043]">
                    <th className="py-3 px-2 text-black font-black text-center whitespace-nowrap">DEPOSIT</th>
                    <th className="py-3 px-2 text-black font-black text-center whitespace-nowrap">DAILY</th>
                    <th className="py-3 px-2 text-black font-black text-center whitespace-nowrap">MONTHLY</th>
                    <th className="py-3 px-2 text-black font-black text-center whitespace-nowrap">TOTAL 6MNTHS</th>
                    <th className="py-3 px-2 text-black font-black text-center whitespace-nowrap">PROFITS</th>
                  </tr>
                </thead>
                <tbody>
                  {stakingTable.map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-[#1A1E2A]" : "bg-[#151A28]"}>
                      <td className="py-2.5 px-2 text-white/90 text-center font-bold">{r.deposit}</td>
                      <td className="py-2.5 px-2 text-white/90 text-center">{r.daily}</td>
                      <td className="py-2.5 px-2 text-white/90 text-center">{r.monthly}</td>
                      <td className="py-2.5 px-2 text-white/90 text-center">{r.total6}</td>
                      <td className="py-2.5 px-2 text-[#EBA043] text-center font-black">{r.profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-[#EBA043] rounded-[12px] py-3 px-4">
              <h2 className="text-center text-black text-[15px] font-black">Team Salary Requirements</h2>
            </div>

            <div className="mt-4 rounded-[14px] overflow-hidden border border-white/10 bg-[#1A1E2A]">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-[#EBA043]">
                      <th className="py-3 px-2 text-black font-black text-center">SALARY</th>
                      <th className="py-3 px-2 text-black font-black text-center">STAKE WORTH</th>
                      <th className="py-3 px-2 text-black font-black text-center">TEAM</th>
                      <th className="py-3 px-2 text-black font-black text-center">TEAM TYPE</th>
                      <th className="py-3 px-2 text-black font-black text-center">TEAM STAKE WORTH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryTable.map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-[#1A1E2A]" : "bg-[#151A28]"}>
                        <td className="py-3 px-2 text-[#EBA043] text-center font-black">{r.salary}</td>
                        <td className="py-3 px-2 text-white text-center font-bold">{r.stakeWorth}</td>
                        <td className="py-3 px-2 text-white text-center">{r.team}</td>
                        <td className="py-3 px-2 text-white/60 text-center">{r.teamType}</td>
                        <td className="py-3 px-2 text-white text-center font-bold">{r.teamStake}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-[#151A28] rounded-[14px] border border-[#EBA043]/30 p-4">
            <p className="text-[#EBA043] text-[13px] font-black">Note:</p>
            <p className="mt-2 text-white/80 text-[12px] leading-[18px]">
              Salary is paid on every 15th of each month.<br/>
              When you meet the requirements please present your self with evidence to the hiring manager.
            </p>
          </div>
        </div>
      </div>
      
      {/* FORCE BottomNav visible */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999]">
        <BottomNav />
      </div>
    </>
  );
}