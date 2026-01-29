import Link from "next/link";

export default function ClearviewSources() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/clearview" className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-900 dark:bg-zinc-100 rounded-sm" />
            <span className="font-bold text-lg tracking-tight">ClearView</span>
          </Link>
          <div className="flex gap-4 text-sm font-medium text-zinc-500">
            <Link href="/clearview/sources" className="text-zinc-900 dark:text-zinc-100">Sources</Link>
            <Link href="/clearview/methodology" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Methodology</Link>
            <Link href="/clearview/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Source Architecture</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-12">
          Tested ~200 RSS feeds organized by how information flows through society — from raw events to public sentiment.
        </p>

        {/* ── The Story Lifecycle ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">The Story Lifecycle</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Every story follows the same path. Something happens. Journalists report it. Elites frame it. People react. Pollsters measure what people think.
            Then it loops — public opinion shapes the next round of influence and reporting. ClearView captures every layer.
          </p>
          <div className="grid md:grid-cols-5 gap-3">
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Layer 1</div>
              <div className="text-sm font-bold mb-1">Primary Sources</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">The raw material. Government, courts, corporate filings.</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-1">Layer 2</div>
              <div className="text-sm font-bold mb-1">News</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Journalism at every level. National, state, local, international.</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-1">Layer 3</div>
              <div className="text-sm font-bold mb-1">Influence</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Who frames it. Think tanks, magazines, newsletters, NGOs.</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-1">Layer 4</div>
              <div className="text-sm font-bold mb-1">Reaction</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">How people respond. Social media, cultural media, religious media.</p>
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Layer 5</div>
              <div className="text-sm font-bold mb-1">Public Opinion</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">What the population thinks. Polls, surveys, barometers.</p>
            </div>
          </div>
        </section>

        {/* ── Infrastructure ── */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Infrastructure</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-2">Static Feeds</div>
              <p className="text-sm font-semibold mb-2">~280 feeds, always polling</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Primary sources + journalism + influence + reaction + polling. All free RSS. Firehose model — catch everything as it publishes.
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2">Dynamic Query</div>
              <p className="text-sm font-semibold mb-2">Triggered per story</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Google News RSS for geographic/topic queries. Catches sources we&apos;d never pre-curate. Also used as fallback for major pollsters without RSS.
              </p>
            </div>
            <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Social Feeds</div>
              <p className="text-sm font-semibold mb-2">Existing pipeline</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Twitter, Reddit, Bluesky, Threads — public discourse and reaction. The emotional weather layer.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-lg font-bold mb-2">Google News RSS (Dynamic)</h3>
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Tested &amp; Working</div>
            <code className="text-sm text-zinc-600 dark:text-zinc-300 break-all">
              https://news.google.com/rss/search?q=ICE+raids+Minnesota&amp;hl=en-US&amp;gl=US&amp;ceid=US:en
            </code>
            <p className="text-xs text-zinc-400 mt-2">Returns Guardian, Star Tribune, CNN, local TV stations, etc. No API key needed.</p>
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            <p><span className="font-semibold">Parameters:</span> <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">q</code> = keywords, <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">gl</code> = country, <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">hl</code> = language</p>
            <p><span className="font-semibold">Caveat:</span> Undocumented API, no SLA, URLs are redirect-wrapped. But stable for years.</p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LAYER 1: PRIMARY SOURCES                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full">Layer 1</div>
          <h2 className="text-3xl font-bold">Primary Sources</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          The raw material that news reports <span className="font-semibold">on</span>. Government announcements, court opinions, corporate disclosures, legislative actions.
          When you can read the primary source, you don&apos;t have to trust anyone&apos;s framing.
        </p>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-4">US Federal Government</h3>
          <FeedTable title="5 working feeds" badge="5" badgeColor="green" feeds={govUSFederal} />
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Blocked / No RSS</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              White House (404), DOJ (404), DHS (403), Treasury (timeout), EPA (404). Use Google News RSS for these agencies.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-4">International Government &amp; Institutions</h3>
          <FeedTable title="4 working feeds" badge="4" badgeColor="green" feeds={govInternational} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-4">Legal &amp; Courts</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Legal proceedings drive huge news cycles. SCOTUS Blog is the gold standard for Supreme Court coverage. Courthouse News covers federal and state courts nationwide.
          </p>
          <FeedTable title="5 working feeds" badge="5" badgeColor="green" feeds={legalSources} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-4">Corporate &amp; Financial</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Press releases and disclosures are the primary sources that financial and business journalism reports on. PR Newswire alone distributes for most Fortune 500 companies.
          </p>
          <FeedTable title="3 working feeds" badge="3" badgeColor="green" feeds={corporateFinancial} />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LAYER 2: NEWS                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-blue-500 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">Layer 2</div>
          <h2 className="text-3xl font-bold">News</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Journalism at every level — national, state, city, beat-specific, international, diaspora, labor, and military.
          This is the &quot;what happened&quot; layer.
        </p>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">States Newsroom Network</h3>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              <span className="font-bold">Bias note:</span> MBFC rates States Newsroom as <span className="font-semibold">LEFT</span> with <span className="font-semibold">HIGH factual reporting</span> and <span className="font-semibold">HIGH credibility</span>.
              Pair with center/right state-level sources for balance.
            </p>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
            Nonprofit newsrooms covering <span className="font-semibold">all 50 states</span>. 100% RSS reliability. Original investigative state-level journalism.
            All feeds use <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{`{domain}`}/feed/</code> pattern.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            <span className="font-semibold">Gap:</span> Covers state capitals and policy, not city-level news. See Metro section below for cities.
          </p>
          <FeedTable title="22/22 tested — all working" badge="100%" badgeColor="green" feeds={statesNewsroom} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">AJP Nonprofit Newsrooms</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            City and community-level outlets funded by the American Journalism Project. Break local stories national outlets miss.
          </p>
          <FeedTable title="10/14 tested — working" badge="71%" badgeColor="amber" feeds={ajpNewsrooms} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Major Metro Newspapers</h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
              <span className="font-bold">Bias pattern:</span> Nearly all major metro papers are rated <span className="font-semibold">Left-Center</span> by MBFC.
              Only Right-Center: <span className="font-semibold">Chicago Tribune</span>.
              Only Center: <span className="font-semibold">Oregonian</span>. All rated HIGH for factual reporting.
            </p>
          </div>
          <FeedTable title="15 working feeds across major metros" badge="15" badgeColor="green" feeds={metroNewspapers} />
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-2">Blocked / No RSS</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              SF Chronicle, Seattle Times (403), Atlanta JC (404), Detroit News (404), Detroit Free Press (404), Houston Chronicle (410), MPR News (403), Arizona Republic (404), Milwaukee Journal Sentinel (404). Use Google News RSS queries for these metros.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Beat-Specific / Investigative</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Stories that cross geography but need specialist reporting. Criminal justice, climate, health, education, Indigenous affairs.
          </p>
          <FeedTable title="10/13 tested — working" badge="77%" badgeColor="green" feeds={beatSpecific} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Diaspora &amp; Ethnic Media</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Communities that see stories through a fundamentally different lens. The Root covers Black America. JTA covers Jewish affairs globally. La Opini&oacute;n is the largest Spanish-language daily in the US. Amsterdam News has covered Harlem since 1909.
          </p>
          <FeedTable title="7 working feeds" badge="7" badgeColor="green" feeds={diasporaEthnicMedia} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Labor &amp; Worker Media</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Growing cultural influence, rarely covered by mainstream outlets. Labor Notes has covered the shop floor since 1979. The American Prospect is the leading progressive policy magazine.
          </p>
          <FeedTable title="3 working feeds" badge="3" badgeColor="green" feeds={laborMedia} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Military &amp; Defense</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            The military community&apos;s own media. Task &amp; Purpose is read by veterans and active duty. Breaking Defense covers the defense industry.
          </p>
          <FeedTable title="3 working feeds" badge="3" badgeColor="green" feeds={militaryDefenseMedia} />
        </section>

        {/* International News */}
        <section className="mb-8">
          <h3 className="text-xl font-bold mb-2">International News</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            English-language feeds covering every major world region. On-the-ground perspectives that US outlets miss or filter through their own framing.
          </p>
          <div className="p-4 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl mb-6">
            <p className="text-sm text-violet-800 dark:text-violet-300 leading-relaxed">
              <span className="font-bold">Why this matters:</span> For stories like Iran, Venezuela, or the Middle East, US outlets (NYT, CNN, Reuters) offer one lens.
              Al Jazeera, Dawn, Meduza, and regional papers provide fundamentally different sourcing, context, and framing.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h4 className="text-lg font-bold mb-4">Middle East &amp; North Africa</h4>
          <FeedTable title="7 working feeds" badge="7" badgeColor="green" feeds={middleEastNorthAfrica} />
        </section>

        <section className="mb-16">
          <h4 className="text-lg font-bold mb-4">Asia-Pacific</h4>
          <FeedTable title="9 working feeds" badge="9" badgeColor="green" feeds={asiaPacific} />
        </section>

        <section className="mb-16">
          <h4 className="text-lg font-bold mb-4">Europe</h4>
          <FeedTable title="7 working feeds" badge="7" badgeColor="green" feeds={europe} />
        </section>

        <section className="mb-16">
          <h4 className="text-lg font-bold mb-4">Latin America &amp; Caribbean</h4>
          <FeedTable title="6 working feeds" badge="6" badgeColor="green" feeds={latinAmericaCaribbean} />
        </section>

        <section className="mb-16">
          <h4 className="text-lg font-bold mb-4">Africa</h4>
          <FeedTable title="6 working feeds" badge="6" badgeColor="green" feeds={africa} />
        </section>

        <section className="mb-16">
          <h4 className="text-lg font-bold mb-4">Russia &amp; Eastern Europe</h4>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl mb-4">
            <p className="text-sm text-rose-800 dark:text-rose-300 leading-relaxed">
              <span className="font-bold">Caution:</span> RT is <span className="font-semibold">Kremlin state-owned</span> propaganda. Including it provides the &quot;what Russia says&quot; perspective, but should always be flagged. Meduza and NV Ukraine offer counter-perspectives.
            </p>
          </div>
          <FeedTable title="6 working feeds" badge="6" badgeColor="green" feeds={russiaEasternEurope} />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LAYER 3: INFLUENCE                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-violet-500 bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full">Layer 3</div>
          <h2 className="text-3xl font-bold">Influence</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          Not news outlets — these are the organizations and voices that shape how people <span className="font-semibold">interpret</span> the news.
          Think tanks write the policy. Cultural magazines frame the discourse. NGO reports become the news. Newsletters set the narrative.
        </p>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Substacks &amp; Newsletters</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Highest ROI category. Every Substack follows <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{`{name}`}.substack.com/feed</code> — one pattern gives access to hundreds of the most influential individual voices.
          </p>
          <FeedTable title="7 working feeds (scalable to hundreds)" badge="7+" badgeColor="green" feeds={substackVoices} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Think Tanks &amp; Policy Orgs</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Their research becomes policy and gets cited as neutral expertise. Heritage wrote Project 2025. Brookings shapes center-left policy. Crisis Group&apos;s reports trigger Security Council meetings.
          </p>
          <FeedTable title="12 working feeds — US + international" badge="12" badgeColor="green" feeds={thinkTanksPolicy} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Cultural &amp; Ideas Magazines</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Where political identity gets articulated. A single Atlantic essay shifts discourse for weeks. Project Syndicate publishes heads of state. Full ideological spectrum represented.
          </p>
          <FeedTable title="20 working feeds across the spectrum" badge="20" badgeColor="green" feeds={culturalIdeasMagazines} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Global NGOs &amp; Institutions</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            When Amnesty or HRW publishes a report, it <span className="font-semibold">becomes</span> the news. IMF and WTO communications move markets. One report generates hundreds of news articles.
          </p>
          <FeedTable title="8 working feeds" badge="8" badgeColor="green" feeds={globalNgosInstitutions} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Security, Defense &amp; Regional Analysis</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Expert analysis that shapes how policymakers and journalists understand conflicts. War on the Rocks is read by Pentagon staffers. Lowy Interpreter is essential for Indo-Pacific.
          </p>
          <FeedTable title="5 working feeds" badge="5" badgeColor="green" feeds={securityDefenseAnalysis} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Scientific &amp; Tech Culture</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            COVID proved scientific journal output directly drives policy and public behavior. Nature and The Lancet shape global health policy. Wired and Ars Technica shape the tech-society discourse.
          </p>
          <FeedTable title="6 working feeds" badge="6" badgeColor="green" feeds={scientificAcademic} />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LAYER 4: REACTION                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-rose-500 bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full">Layer 4</div>
          <h2 className="text-3xl font-bold">Reaction</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          How people respond. Not what happened, not who framed it — but how it <span className="font-semibold">lands</span> across different cultural layers.
          This is the emotional weather. A Supreme Court decision reads one way in Reuters copy and a completely different way in a Jezebel analysis or a pastor&apos;s Sunday sermon.
        </p>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Social Media</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Already in the pipeline. Twitter, Reddit, Bluesky, Threads — the raw public discourse layer.
          </p>
          <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">Live</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Existing social feed pipeline. Four platforms, real-time reaction capture.</p>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Women&apos;s &amp; Culture Media</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Shapes how millions interpret political events through cultural, not journalistic, framing. Where political news meets personal identity.
          </p>
          <FeedTable title="6 working feeds" badge="6" badgeColor="green" feeds={womensCultureMedia} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Religious Media</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Shapes moral framing for billions. Invisible to secular media analysis but enormously influential. Vatican communications reach 1.3B Catholics. Christianity Today set evangelical discourse when it called for Trump&apos;s removal.
          </p>
          <FeedTable title="6 working feeds" badge="6" badgeColor="green" feeds={religiousMedia} />
        </section>

        <section className="mb-16 p-6 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <h3 className="text-lg font-bold mb-3">Future: Deeper Reaction Layer</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
            The written RSS sources above capture <span className="font-semibold">published</span> reactions. The deeper emotional weather lives in unstructured spaces:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">Have Now</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Social feeds (4 platforms) + women&apos;s/culture media + religious media RSS</p>
            </div>
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-lg">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Future</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Podcast transcripts, YouTube commentary, TikTok trends, creator platforms, community forums. Different data problem — messy, unstructured, but where emotional temperature actually lives.</p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LAYER 5: PUBLIC OPINION                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <div className="mb-8 mt-20 flex items-center gap-3">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">Layer 5</div>
          <h2 className="text-3xl font-bold">Public Opinion</h2>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-10">
          What the actual population thinks. Not what journalists report, not what think tanks frame, not what Twitter says —
          but what <span className="font-semibold">representative samples of people</span> believe when asked directly.
          Essential for understanding whether media narratives match or diverge from public sentiment.
        </p>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Direct RSS Feeds</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Pollsters and aggregators with native RSS. Pew is the gold standard. FiveThirtyEight grades pollsters A+ through F.
            Afrobarometer and Arab Barometer provide data from regions where Western polling rarely reaches.
          </p>
          <FeedTable title="8 working feeds" badge="8" badgeColor="green" feeds={publicOpinionDirect} />
        </section>

        <section className="mb-16">
          <h3 className="text-xl font-bold mb-2">Major Pollsters via Google News RSS</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            The biggest pollsters — Gallup, YouGov, Morning Consult, Quinnipiac, NORC — have no RSS feeds.
            Google News RSS queries catch every article reporting their findings.
          </p>
          <FeedTable title="12 pollsters via Google News — all working" badge="12" badgeColor="amber" feeds={publicOpinionGoogleNews} />
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              <span className="font-bold">Note:</span> Google News queries return <span className="font-semibold">coverage about</span> these polls, not raw data.
              A &quot;Gallup poll&quot; query returns CNN, Fox, AP articles <span className="font-semibold">citing</span> the poll — which is actually useful, because you see how different outlets spin the same numbers.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* CASE STUDY & INSIGHTS                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}

        <section className="mb-16 mt-20">
          <h2 className="text-2xl font-bold mb-4">Case Study: Minnesota ICE Raids</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            How each layer contributes to a single story:
          </p>
          <div className="space-y-3">
            <CaseStudyItem
              source="Minnesota Reformer (States Newsroom)"
              headline="Klobuchar, Smith pay tribute to Minnesota victims on US Senate floor, call for ICE reforms"
              detail="Original reporting from the Senate floor with MN-specific political context. Reporter Mike Mosedale also covering DHS blocking lawyers from detainees."
            />
            <CaseStudyItem
              source="Sahan Journal (AJP nonprofit)"
              headline="ICE isn't just tracking your phone. The surveillance technology goes further than that."
              detail="Deep investigation into ICE surveillance tech — facial recognition, stingrays, neighborhood monitoring. Perspective from immigrant communities. No national outlet has this."
            />
            <CaseStudyItem
              source="Google News RSS query"
              headline="Two agents who shot Alex Pretti put on leave..."
              detail="Dynamic query pulls in Guardian, Star Tribune, CNN, local TV — whatever is covering it. Catches sources we'd never pre-curate."
            />
            <CaseStudyItem
              source="MinnPost (AJP nonprofit)"
              headline="Various Minnesota-focused coverage"
              detail="Nonprofit, in-depth civic affairs. Adds analytical depth on state policy implications."
            />
          </div>
        </section>

        <section className="mb-16 p-6 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl">
          <h2 className="text-lg font-bold mb-3">Key Insight</h2>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3">
            50,000 sources is marketing. Research shows <span className="font-semibold">80% of news content is recycled</span> from a small number of original sources.
            When AP publishes a story, it appears in 1,300+ newspapers — Ground News counts each as a separate &quot;source.&quot;
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            The number that matters isn&apos;t &quot;how many sources covered this&quot; — it&apos;s <span className="font-semibold">&quot;how many distinct factual claims and framings exist.&quot;</span> With
            ~280 curated feeds spanning every layer from primary sources to public opinion + Google News for dynamic discovery, ClearView covers more unique perspectives than an aggregator with 50K wire-copy republishers.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-lg font-bold mb-3">Research Sources</h2>
          <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
            <li><a href="https://statesnewsroom.com/newsrooms/" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">States Newsroom — All Newsrooms</a></li>
            <li><a href="https://statesnewsroom.com/rss-feeds/" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">States Newsroom — RSS Feeds</a></li>
            <li><a href="https://www.theajp.org/our-portfolio/" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">American Journalism Project — Portfolio</a></li>
            <li><a href="https://www.newscatcherapi.com/blog-posts/google-news-rss-search-parameters-the-missing-documentaiton" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">NewsCatcher — Google News RSS Parameters (Missing Docs)</a></li>
            <li><a href="https://www.pewresearch.org/journalism/2010/01/11/how-news-happens/" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">Pew — How News Happens (80% recycled content)</a></li>
            <li><a href="https://localnewsinitiative.northwestern.edu/projects/state-of-local-news/2024/report/" className="underline hover:text-zinc-900 dark:hover:text-zinc-100">Medill/Northwestern — State of Local News 2024</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

/* ── Layer 1: Primary Sources ── */

const govUSFederal = [
  { name: "Congress — Most Viewed Bills", state: "Legislative", feed: "congress.gov/rss/most-viewed-bills.xml", status: "ok" as const, lean: "Official" },
  { name: "Congress — Presented to President", state: "Legislative", feed: "congress.gov/rss/presented-to-president.xml", status: "ok" as const, lean: "Official" },
  { name: "Federal Register", state: "Regulatory", feed: "federalregister.gov/documents/search.atom", status: "ok" as const, lean: "Official" },
  { name: "State Department", state: "Foreign policy", feed: "state.gov/feed/", status: "ok" as const, lean: "Official" },
  { name: "SEC Press Releases", state: "Financial", feed: "sec.gov/news/pressreleases.rss", status: "ok" as const, lean: "Official" },
];

const govInternational = [
  { name: "European Commission", state: "EU", feed: "ec.europa.eu/commission/presscorner/api/rss", status: "ok" as const, lean: "Official" },
  { name: "UK Government", state: "UK", feed: "gov.uk/government/feed", status: "ok" as const, lean: "Official" },
  { name: "UN Press", state: "Global", feed: "press.un.org/en/rss.xml", status: "ok" as const, lean: "Official" },
  { name: "NATO", state: "Alliance", feed: "nato.int/cps/en/natohq/news.htm?rss=true", status: "ok" as const, lean: "Official" },
];

const legalSources = [
  { name: "SCOTUSblog", state: "Supreme Court", feed: "scotusblog.com/feed/", status: "ok" as const, lean: "Nonpartisan" },
  { name: "Courthouse News", state: "Federal/State", feed: "courthousenews.com/feed/", status: "ok" as const, lean: "Nonpartisan" },
  { name: "JURIST", state: "Legal news", feed: "jurist.org/feed/", status: "ok" as const, lean: "Academic" },
  { name: "Volokh Conspiracy", state: "Constitutional", feed: "reason.com/volokh/feed/", status: "ok" as const, lean: "Libertarian" },
  { name: "Balkinization", state: "Constitutional", feed: "balkin.blogspot.com/feeds/posts/default", status: "ok" as const, lean: "Left-liberal" },
];

const corporateFinancial = [
  { name: "PR Newswire", state: "Press releases", feed: "prnewswire.com/rss/", status: "ok" as const, lean: "Corporate" },
  { name: "GlobeNewswire", state: "Press releases", feed: "globenewswire.com/RssFeed/subjectcode/01-General%20Corporate/feedTitle/GlobeNewswire", status: "ok" as const, lean: "Corporate" },
  { name: "SEC Press Releases", state: "Regulatory", feed: "sec.gov/news/pressreleases.rss", status: "ok" as const, lean: "Official" },
];

/* ── Layer 2: News ── */

const statesNewsroom = [
  { name: "Arizona Mirror", state: "AZ", feed: "azmirror.com/feed/", status: "ok" as const },
  { name: "Colorado Newsline", state: "CO", feed: "coloradonewsline.com/feed/", status: "ok" as const },
  { name: "Nevada Current", state: "NV", feed: "nevadacurrent.com/feed/", status: "ok" as const },
  { name: "Florida Phoenix", state: "FL", feed: "floridaphoenix.com/feed/", status: "ok" as const },
  { name: "Georgia Recorder", state: "GA", feed: "georgiarecorder.com/feed/", status: "ok" as const },
  { name: "Kentucky Lantern", state: "KY", feed: "kentuckylantern.com/feed/", status: "ok" as const },
  { name: "Ohio Capital Journal", state: "OH", feed: "ohiocapitaljournal.com/feed/", status: "ok" as const },
  { name: "Missouri Independent", state: "MO", feed: "missouriindependent.com/feed/", status: "ok" as const },
  { name: "Michigan Advance", state: "MI", feed: "michiganadvance.com/feed/", status: "ok" as const },
  { name: "Wisconsin Examiner", state: "WI", feed: "wisconsinexaminer.com/feed/", status: "ok" as const },
  { name: "Indiana Capital Chronicle", state: "IN", feed: "indianacapitalchronicle.com/feed/", status: "ok" as const },
  { name: "Iowa Capital Dispatch", state: "IA", feed: "iowacapitaldispatch.com/feed/", status: "ok" as const },
  { name: "Virginia Mercury", state: "VA", feed: "virginiamercury.com/feed/", status: "ok" as const },
  { name: "NC Newsline", state: "NC", feed: "ncnewsline.com/feed/", status: "ok" as const },
  { name: "Louisiana Illuminator", state: "LA", feed: "lailluminator.com/feed/", status: "ok" as const },
  { name: "Alabama Reflector", state: "AL", feed: "alabamareflector.com/feed/", status: "ok" as const },
  { name: "Tennessee Lookout", state: "TN", feed: "tennesseelookout.com/feed/", status: "ok" as const },
  { name: "NJ Monitor", state: "NJ", feed: "newjerseymonitor.com/feed/", status: "ok" as const },
  { name: "Maryland Matters", state: "MD", feed: "marylandmatters.org/feed/", status: "ok" as const },
  { name: "CT Mirror", state: "CT", feed: "ctmirror.org/feed/", status: "ok" as const },
  { name: "Minnesota Reformer", state: "MN", feed: "minnesotareformer.com/feed/", status: "ok" as const },
  { name: "Texas Tribune", state: "TX", feed: "texastribune.org/feeds/latest/", status: "ok" as const },
  { name: "Alaska Beacon", state: "AK", feed: "alaskabeacon.com/feed/", status: "untested" as const },
  { name: "Idaho Capital Sun", state: "ID", feed: "idahocapitalsun.com/feed/", status: "untested" as const },
  { name: "Daily Montanan", state: "MT", feed: "dailymontanan.com/feed/", status: "untested" as const },
  { name: "Oregon Capital Chronicle", state: "OR", feed: "oregoncapitalchronicle.com/feed/", status: "untested" as const },
  { name: "Washington State Standard", state: "WA", feed: "washingtonstatestandard.com/feed/", status: "untested" as const },
  { name: "WyoFile", state: "WY", feed: "wyofile.com/feed/", status: "untested" as const },
  { name: "Kansas Reflector", state: "KS", feed: "kansasreflector.com/feed/", status: "untested" as const },
  { name: "Nebraska Examiner", state: "NE", feed: "nebraskaexaminer.com/feed/", status: "untested" as const },
  { name: "North Dakota Monitor", state: "ND", feed: "northdakotamonitor.com/feed/", status: "untested" as const },
  { name: "Oklahoma Voice", state: "OK", feed: "oklahomavoice.com/feed/", status: "untested" as const },
  { name: "South Dakota Searchlight", state: "SD", feed: "southdakotasearchlight.com/feed/", status: "untested" as const },
  { name: "Capitol News Illinois", state: "IL", feed: "capitolnewsillinois.com/feed/", status: "untested" as const },
  { name: "Arkansas Advocate", state: "AR", feed: "arkansasadvocate.com/feed/", status: "untested" as const },
  { name: "Mississippi Today", state: "MS", feed: "mississippitoday.org/feed/", status: "untested" as const },
  { name: "SC Daily Gazette", state: "SC", feed: "scdailygazette.com/feed/", status: "untested" as const },
  { name: "West Virginia Watch", state: "WV", feed: "westvirginiawatch.com/feed/", status: "untested" as const },
  { name: "Commonwealth Beacon", state: "MA", feed: "commonwealthbeacon.org/feed/", status: "untested" as const },
  { name: "Maine Morning Star", state: "ME", feed: "mainemorningstar.com/feed/", status: "untested" as const },
  { name: "NH Bulletin", state: "NH", feed: "newhampshirebulletin.com/feed/", status: "untested" as const },
  { name: "Source New Mexico", state: "NM", feed: "sourcenm.com/feed/", status: "untested" as const },
  { name: "Utah News Dispatch", state: "UT", feed: "utahnewsdispatch.com/feed/", status: "untested" as const },
];

const ajpNewsrooms = [
  { name: "Block Club Chicago", state: "IL", feed: "blockclubchicago.org/feed/", status: "ok" as const },
  { name: "THE CITY", state: "NY", feed: "thecity.nyc/feed/", status: "ok" as const },
  { name: "Colorado Sun", state: "CO", feed: "coloradosun.com/feed/", status: "ok" as const },
  { name: "Mission Local", state: "CA", feed: "missionlocal.org/feed/", status: "ok" as const },
  { name: "Mountain State Spotlight", state: "WV", feed: "mountainstatespotlight.org/feed/", status: "ok" as const },
  { name: "Nashville Banner", state: "TN", feed: "nashvillebanner.com/feed/", status: "ok" as const },
  { name: "El Paso Matters", state: "TX", feed: "elpasomatters.org/feed/", status: "ok" as const },
  { name: "Capital B", state: "GA/IN", feed: "capitalbnews.org/feed/", status: "ok" as const },
  { name: "San Jose Spotlight", state: "CA", feed: "sanjosespotlight.com/feed/", status: "ok" as const },
  { name: "DocumentedNY", state: "NY", feed: "documentedny.com/feed/", status: "ok" as const },
  { name: "Sahan Journal", state: "MN", feed: "sahanjournal.com/feed/", status: "ok" as const },
  { name: "MinnPost", state: "MN", feed: "minnpost.com/feed/", status: "ok" as const },
  { name: "Grist", state: "National", feed: "grist.org/feed/", status: "ok" as const },
  { name: "Honolulu Civil Beat", state: "HI", feed: "—", status: "broken" as const },
  { name: "Spotlight PA", state: "PA", feed: "—", status: "broken" as const },
];

const metroNewspapers = [
  { name: "Philadelphia Inquirer", state: "PA", feed: "inquirer.com/arcio/rss/", status: "ok" as const, lean: "Left-Center" },
  { name: "Boston Globe", state: "MA", feed: "bostonglobe.com/arc/outboundfeeds/rss/homepage/", status: "ok" as const, lean: "Left-Center" },
  { name: "Star Tribune", state: "MN", feed: "startribune.com/feed/ (follow redirects)", status: "ok" as const, lean: "Left-Center" },
  { name: "MinnPost", state: "MN", feed: "minnpost.com/feed/", status: "ok" as const, lean: "Left-Center" },
  { name: "Pioneer Press", state: "MN (St. Paul)", feed: "twincities.com/feed/", status: "ok" as const, lean: "Left-Center" },
  { name: "Denver Post", state: "CO", feed: "denverpost.com/feed/", status: "ok" as const, lean: "Left-Center" },
  { name: "Dallas Morning News", state: "TX", feed: "dallasnews.com/arc/outboundfeeds/rss/", status: "ok" as const, lean: "Left-Center" },
  { name: "LA Times", state: "CA", feed: "latimes.com/rss2.0.xml", status: "ok" as const, lean: "Left-Center" },
  { name: "Miami Herald", state: "FL", feed: "Google News RSS fallback", status: "broken" as const, lean: "Left-Center" },
  { name: "Tampa Bay Times", state: "FL", feed: "tampabay.com/arcio/rss/", status: "ok" as const, lean: "Left-Center" },
  { name: "Chicago Sun-Times", state: "IL", feed: "chicago.suntimes.com/rss/index.xml", status: "ok" as const, lean: "Left-Center" },
  { name: "Chicago Tribune", state: "IL", feed: "chicagotribune.com/arcio/rss/ (redirect)", status: "ok" as const, lean: "Right-Center" },
  { name: "The Oregonian", state: "OR", feed: "oregonlive.com/arc/outboundfeeds/rss/", status: "ok" as const, lean: "Center" },
  { name: "St. Louis Post-Dispatch", state: "MO", feed: "stltoday.com/search/?f=rss&t=article&c=news", status: "ok" as const, lean: "Left-Center" },
  { name: "New York Times", state: "NY", feed: "rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", status: "ok" as const, lean: "Left-Center" },
  { name: "Washington Post", state: "DC", feed: "feeds.washingtonpost.com/rss/national", status: "ok" as const, lean: "Left-Center" },
];

const beatSpecific = [
  { name: "ProPublica", state: "Investigations", feed: "propublica.org/feeds/propublica/main", status: "ok" as const },
  { name: "The Intercept", state: "Nat'l Security", feed: "theintercept.com/feed/?rss", status: "ok" as const },
  { name: "Reveal (CIR)", state: "Investigations", feed: "revealnews.org/feed/", status: "ok" as const },
  { name: "19th News", state: "Gender Equity", feed: "19thnews.org/feed/", status: "ok" as const },
  { name: "Inside Climate News", state: "Climate", feed: "insideclimatenews.org/feed/", status: "ok" as const },
  { name: "Ctr for Public Integrity", state: "Corruption", feed: "publicintegrity.org/feed", status: "ok" as const },
  { name: "Military Times", state: "Military", feed: "militarytimes.com/arc/outboundfeeds/rss/", status: "ok" as const },
  { name: "Education Week", state: "Education", feed: "edweek.org/feed", status: "ok" as const },
  { name: "KFF Health News", state: "Healthcare", feed: "kffhealthnews.org/feed/", status: "ok" as const },
  { name: "ICT News", state: "Indigenous", feed: "ictnews.org/feed/", status: "ok" as const },
];

const diasporaEthnicMedia = [
  { name: "The Root", state: "Black America", feed: "theroot.com/rss", status: "ok" as const, lean: "Left" },
  { name: "JTA (Jewish Telegraphic Agency)", state: "Jewish affairs", feed: "jta.org/feed", status: "ok" as const, lean: "Center" },
  { name: "American Bazaar", state: "South Asian American", feed: "americanbazaaronline.com/feed/", status: "ok" as const, lean: "Independent" },
  { name: "El Diario (Spain)", state: "Spanish-language", feed: "eldiario.es/rss/", status: "ok" as const, lean: "Left" },
  { name: "Remezcla", state: "Latinx culture", feed: "remezcla.com/feed/", status: "ok" as const, lean: "Liberal-cultural" },
  { name: "La Opinión", state: "US Spanish-language", feed: "laopinion.com/feed/", status: "ok" as const, lean: "Left-Center" },
  { name: "Amsterdam News", state: "Black (Harlem, est. 1909)", feed: "amsterdamnews.com/feed/", status: "ok" as const, lean: "Left" },
];

const laborMedia = [
  { name: "Labor Notes", state: "Labor movement", feed: "labornotes.org/feed", status: "ok" as const, lean: "Left, pro-labor" },
  { name: "The American Prospect", state: "Progressive policy", feed: "prospect.org/feed", status: "ok" as const, lean: "Left" },
  { name: "In These Times", state: "Labor/progressive", feed: "inthesetimes.com/feed", status: "ok" as const, lean: "Left" },
];

const militaryDefenseMedia = [
  { name: "Task & Purpose", state: "Veterans/Active duty", feed: "taskandpurpose.com/feed/", status: "ok" as const, lean: "Independent" },
  { name: "Breaking Defense", state: "Defense industry", feed: "breakingdefense.com/feed/", status: "ok" as const, lean: "Center" },
  { name: "Military Times", state: "All branches", feed: "militarytimes.com/arc/outboundfeeds/rss/", status: "ok" as const, lean: "Center" },
];

/* ── International News ── */

const middleEastNorthAfrica = [
  { name: "Al Jazeera English", state: "Qatar", feed: "aljazeera.com/xml/rss/all.xml", status: "ok" as const, lean: "Pan-Arab, state-funded" },
  { name: "Middle East Eye", state: "UK-based", feed: "middleeasteye.net/rss", status: "ok" as const, lean: "Independent" },
  { name: "The National", state: "UAE", feed: "thenationalnews.com/arc/outboundfeeds/rss/", status: "ok" as const, lean: "State-aligned" },
  { name: "Dawn", state: "Pakistan", feed: "dawn.com/feed", status: "ok" as const, lean: "Independent, liberal" },
  { name: "Times of Israel", state: "Israel", feed: "timesofisrael.com/feed/", status: "ok" as const, lean: "Center" },
  { name: "Haaretz", state: "Israel", feed: "haaretz.com/cmlink/1.628765", status: "ok" as const, lean: "Left-liberal" },
  { name: "Al-Monitor", state: "US-based", feed: "al-monitor.com/rss", status: "ok" as const, lean: "Independent, policy-focused" },
];

const asiaPacific = [
  { name: "Bangkok Post", state: "Thailand", feed: "bangkokpost.com/rss/data/topstories.xml", status: "ok" as const, lean: "Independent" },
  { name: "Straits Times", state: "Singapore", feed: "straitstimes.com/news/asia/rss.xml", status: "ok" as const, lean: "Pro-government" },
  { name: "Japan Today", state: "Japan", feed: "japantoday.com/feed", status: "ok" as const, lean: "Independent" },
  { name: "Taiwan News", state: "Taiwan", feed: "taiwannews.com.tw/rss", status: "ok" as const, lean: "Independent, pro-sovereignty" },
  { name: "Rappler", state: "Philippines", feed: "rappler.com/feed/", status: "ok" as const, lean: "Independent" },
  { name: "NZ Herald", state: "New Zealand", feed: "nzherald.co.nz/arc/outboundfeeds/rss/", status: "ok" as const, lean: "Center-Right" },
  { name: "South China Morning Post", state: "Hong Kong", feed: "scmp.com/rss/91/feed", status: "ok" as const, lean: "Pro-Beijing shift" },
  { name: "The Hindu", state: "India", feed: "thehindu.com/feeder/default.rss", status: "ok" as const, lean: "Left-Center" },
  { name: "ABC News (AU)", state: "Australia", feed: "abc.net.au/news/feed/51120/rss.xml", status: "ok" as const, lean: "Center, public broadcaster" },
];

const europe = [
  { name: "The Guardian", state: "UK", feed: "theguardian.com/world/rss", status: "ok" as const, lean: "Left-Center" },
  { name: "BBC News", state: "UK", feed: "feeds.bbci.co.uk/news/rss.xml", status: "ok" as const, lean: "Center, public broadcaster" },
  { name: "DW (Deutsche Welle)", state: "Germany", feed: "rss.dw.com/xml/rss-en-all", status: "ok" as const, lean: "Center, public broadcaster" },
  { name: "France 24", state: "France", feed: "france24.com/en/rss", status: "ok" as const, lean: "Center, public broadcaster" },
  { name: "The Irish Times", state: "Ireland", feed: "irishtimes.com/cmlink/the-irish-times-news-1.1837", status: "ok" as const, lean: "Center-Left" },
  { name: "The Local (EU)", state: "Multi-country", feed: "thelocal.com/tag/breaking-news/feed/", status: "ok" as const, lean: "Independent, expat-focused" },
  { name: "Euronews", state: "France-based", feed: "euronews.com/rss", status: "ok" as const, lean: "Center" },
];

const latinAmericaCaribbean = [
  { name: "Buenos Aires Times", state: "Argentina", feed: "batimes.com.ar/feed", status: "ok" as const, lean: "Independent, English" },
  { name: "Colombia Reports", state: "Colombia", feed: "colombiareports.com/feed/", status: "ok" as const, lean: "Independent, English" },
  { name: "Mexico News Daily", state: "Mexico", feed: "mexiconewsdaily.com/feed/", status: "ok" as const, lean: "Independent, English" },
  { name: "Tico Times", state: "Costa Rica", feed: "ticotimes.net/feed", status: "ok" as const, lean: "Independent, English" },
  { name: "Caribbean National Weekly", state: "Caribbean", feed: "caribbeannationalweekly.com/feed/", status: "ok" as const, lean: "Diaspora-focused" },
  { name: "Brazil Wire", state: "Brazil", feed: "brasilwire.com/feed/", status: "ok" as const, lean: "Left, English" },
];

const africa = [
  { name: "Daily Monitor", state: "Uganda", feed: "monitor.co.ug/rss", status: "ok" as const, lean: "Independent" },
  { name: "Premium Times", state: "Nigeria", feed: "premiumtimesng.com/feed", status: "ok" as const, lean: "Independent, investigative" },
  { name: "Mail & Guardian", state: "South Africa", feed: "mg.co.za/feed/", status: "ok" as const, lean: "Left-Center" },
  { name: "Africanews", state: "Pan-African", feed: "africanews.com/feed/", status: "ok" as const, lean: "Center, Euronews-owned" },
  { name: "The East African", state: "East Africa", feed: "theeastafrican.co.ke/tea/rss", status: "ok" as const, lean: "Independent, regional" },
  { name: "The Continent", state: "Pan-African", feed: "thecontinent.org/feed/", status: "ok" as const, lean: "Independent, newsletter" },
];

const russiaEasternEurope = [
  { name: "Meduza", state: "Latvia (Russian exile)", feed: "meduza.io/rss/en/all", status: "ok" as const, lean: "Independent, anti-Kremlin" },
  { name: "RT (Russia Today)", state: "Russia", feed: "rt.com/rss/news/", status: "ok" as const, lean: "State-owned propaganda" },
  { name: "NV Ukraine", state: "Ukraine", feed: "english.nv.ua/rss/all.xml", status: "ok" as const, lean: "Pro-Ukraine" },
  { name: "Balkan Insight", state: "Balkans", feed: "balkaninsight.com/feed/", status: "ok" as const, lean: "Independent, investigative" },
  { name: "Notes from Poland", state: "Poland", feed: "notesfrompoland.com/feed/", status: "ok" as const, lean: "Independent, English" },
  { name: "Hungary Today", state: "Hungary", feed: "hungarytoday.hu/feed/", status: "ok" as const, lean: "Independent, English" },
];

/* ── Layer 3: Influence ── */

const substackVoices = [
  { name: "Heather Cox Richardson", state: "Liberal narrative", feed: "heathercoxrichardson.substack.com/feed", status: "ok" as const, lean: "Left" },
  { name: "Matt Taibbi / Racket News", state: "Anti-establishment", feed: "racket.news/feed", status: "ok" as const, lean: "Heterodox" },
  { name: "Matt Yglesias / Slow Boring", state: "Policy", feed: "mattyglesias.substack.com/feed", status: "ok" as const, lean: "Center-Left" },
  { name: "Popular Information", state: "Corporate accountability", feed: "popularinformation.substack.com/feed", status: "ok" as const, lean: "Left" },
  { name: "Robert Reich", state: "Economics", feed: "robertreich.substack.com/feed", status: "ok" as const, lean: "Left" },
  { name: "Glenn Greenwald", state: "Civil liberties", feed: "greenwald.substack.com/feed", status: "ok" as const, lean: "Heterodox" },
  { name: "Persuasion (Yascha Mounk)", state: "Liberal democracy", feed: "persuasion.community/feed", status: "ok" as const, lean: "Center" },
];

const thinkTanksPolicy = [
  { name: "Brookings Institution", state: "US", feed: "brookings.edu/feed/", status: "ok" as const, lean: "Center-Left" },
  { name: "Heritage Foundation", state: "US", feed: "heritage.org/rss", status: "ok" as const, lean: "Right" },
  { name: "Cato Institute", state: "US", feed: "cato.org/rss/recent-opeds", status: "ok" as const, lean: "Libertarian" },
  { name: "RAND Corporation", state: "US", feed: "rand.org/blog.xml", status: "ok" as const, lean: "Nonpartisan" },
  { name: "Carnegie Endowment", state: "US", feed: "carnegieendowment.org/rss/solr/?lang=en", status: "ok" as const, lean: "Center" },
  { name: "Atlantic Council", state: "US", feed: "atlanticcouncil.org/feed/", status: "ok" as const, lean: "Center-transatlantic" },
  { name: "Stimson Center", state: "US", feed: "stimson.org/feed/", status: "ok" as const, lean: "Nonpartisan" },
  { name: "ECFR", state: "EU", feed: "ecfr.eu/feed/", status: "ok" as const, lean: "Center, pro-EU" },
  { name: "Lowy Institute", state: "Australia", feed: "lowy.org/feed", status: "ok" as const, lean: "Center" },
  { name: "Crisis Group", state: "Global", feed: "crisisgroup.org/rss.xml", status: "ok" as const, lean: "Nonpartisan, conflict" },
  { name: "ISS Africa", state: "Africa", feed: "issafrica.org/feed", status: "ok" as const, lean: "Nonpartisan, security" },
  { name: "Africa Portal", state: "Africa", feed: "africaportal.org/feed/", status: "ok" as const, lean: "Nonpartisan, policy" },
];

const culturalIdeasMagazines = [
  { name: "The Atlantic", state: "US", feed: "theatlantic.com/feed/all/", status: "ok" as const, lean: "Center-Left" },
  { name: "The New Yorker", state: "US", feed: "newyorker.com/feed/everything", status: "ok" as const, lean: "Left" },
  { name: "Foreign Affairs", state: "US", feed: "foreignaffairs.com/rss.xml", status: "ok" as const, lean: "Establishment" },
  { name: "The Free Press", state: "US", feed: "thefp.com/feed", status: "ok" as const, lean: "Center-Right" },
  { name: "National Review", state: "US", feed: "nationalreview.com/feed/", status: "ok" as const, lean: "Right" },
  { name: "The Nation", state: "US", feed: "thenation.com/feed/", status: "ok" as const, lean: "Left" },
  { name: "Jacobin", state: "US", feed: "jacobin.com/feed", status: "ok" as const, lean: "Left / socialist" },
  { name: "UnHerd", state: "UK", feed: "unherd.com/feed/", status: "ok" as const, lean: "Heterodox" },
  { name: "Palladium", state: "US", feed: "palladiummag.com/feed/", status: "ok" as const, lean: "Post-liberal" },
  { name: "Discourse Magazine", state: "US", feed: "discoursemagazine.com/feed/", status: "ok" as const, lean: "Center-Right" },
  { name: "First Things", state: "US", feed: "firstthings.com/feed", status: "ok" as const, lean: "Religious conservative" },
  { name: "Current Affairs", state: "US", feed: "feeds.feedburner.com/currentaffairs", status: "ok" as const, lean: "Left" },
  { name: "New Statesman", state: "UK", feed: "newstatesman.com/feed", status: "ok" as const, lean: "Center-Left" },
  { name: "London Review of Books", state: "UK", feed: "lrb.co.uk/feeds/rss", status: "ok" as const, lean: "Left-intellectual" },
  { name: "Spiked Online", state: "UK", feed: "spiked-online.com/feed/", status: "ok" as const, lean: "Libertarian" },
  { name: "Le Monde Diplomatique", state: "France", feed: "mondediplo.com/backend", status: "ok" as const, lean: "Left, anti-globalist" },
  { name: "Project Syndicate", state: "Global", feed: "project-syndicate.org/rss", status: "ok" as const, lean: "Establishment, global" },
  { name: "The Diplomat", state: "Asia-Pacific", feed: "thediplomat.com/feed/", status: "ok" as const, lean: "Center, Asia-focused" },
  { name: "Americas Quarterly", state: "Latin America", feed: "americasquarterly.org/feed/", status: "ok" as const, lean: "Center, LatAm policy" },
  { name: "China Dialogue", state: "UK/China", feed: "chinadialogue.net/feed/", status: "ok" as const, lean: "Independent, environment" },
];

const globalNgosInstitutions = [
  { name: "Amnesty International", state: "Global", feed: "amnesty.org/en/feed/", status: "ok" as const, lean: "Human rights" },
  { name: "Human Rights Watch", state: "Global", feed: "hrw.org/rss", status: "ok" as const, lean: "Human rights" },
  { name: "UN News", state: "Global", feed: "news.un.org/feed/subscribe/en/news/all/rss.xml", status: "ok" as const, lean: "Multilateral" },
  { name: "WHO", state: "Global", feed: "who.int/rss-feeds/news-english.xml", status: "ok" as const, lean: "Public health" },
  { name: "Oxfam", state: "Global", feed: "oxfam.org/en/rss.xml", status: "ok" as const, lean: "Anti-poverty, left" },
  { name: "Greenpeace", state: "Global", feed: "greenpeace.org/international/feed/", status: "ok" as const, lean: "Environmental" },
  { name: "IMF", state: "Global", feed: "imf.org/en/News/Rss", status: "ok" as const, lean: "Financial stability" },
  { name: "WTO", state: "Global", feed: "wto.org/english/news_e/news_e.rss", status: "ok" as const, lean: "Trade policy" },
];

const securityDefenseAnalysis = [
  { name: "War on the Rocks", state: "US", feed: "warontherocks.com/feed/", status: "ok" as const, lean: "Nonpartisan, defense" },
  { name: "Lowy Interpreter", state: "Australia", feed: "lowyinstitute.org/the-interpreter/rss.xml", status: "ok" as const, lean: "Center, Asia-Pacific" },
  { name: "The Asia Dialogue", state: "UK", feed: "theasiadialogue.com/feed/", status: "ok" as const, lean: "Academic, Asia" },
  { name: "Asan Forum", state: "South Korea", feed: "theasanforum.org/feed/", status: "ok" as const, lean: "Center, East Asia" },
  { name: "Dabanga Sudan", state: "Sudan", feed: "dabangasudan.org/en/feed", status: "ok" as const, lean: "Independent, conflict" },
];

const scientificAcademic = [
  { name: "Nature", state: "UK", feed: "nature.com/nature.rss", status: "ok" as const, lean: "Peer-reviewed" },
  { name: "The Lancet", state: "UK", feed: "thelancet.com/rssfeed/lancet_online.xml", status: "ok" as const, lean: "Medical, peer-reviewed" },
  { name: "BMJ", state: "UK", feed: "bmj.com/rss/recent.xml", status: "ok" as const, lean: "Medical, peer-reviewed" },
  { name: "Wired", state: "US", feed: "wired.com/feed/rss", status: "ok" as const, lean: "Tech-progressive" },
  { name: "Ars Technica", state: "US", feed: "arstechnica.com/feed/", status: "ok" as const, lean: "Tech, evidence-based" },
  { name: "MIT Technology Review", state: "US", feed: "technologyreview.com/feed/", status: "ok" as const, lean: "Tech-academic" },
];

/* ── Layer 4: Reaction ── */

const womensCultureMedia = [
  { name: "Refinery29", state: "US", feed: "refinery29.com/rss.xml", status: "ok" as const, lean: "Liberal-cultural" },
  { name: "Jezebel", state: "US", feed: "jezebel.com/rss", status: "ok" as const, lean: "Left-feminist" },
  { name: "Bustle", state: "US", feed: "bustle.com/rss", status: "ok" as const, lean: "Liberal-cultural" },
  { name: "Ms. Magazine", state: "US", feed: "msmagazine.com/feed/", status: "ok" as const, lean: "Feminist" },
  { name: "Glamour", state: "US", feed: "glamour.com/feed/rss", status: "ok" as const, lean: "Lifestyle-cultural" },
  { name: "Elle", state: "US", feed: "elle.com/rss/all.xml/", status: "ok" as const, lean: "Lifestyle-cultural" },
];

const religiousMedia = [
  { name: "Vatican News", state: "Vatican", feed: "vaticannews.va/en.rss.xml", status: "ok" as const, lean: "Catholic" },
  { name: "Christianity Today", state: "US", feed: "christianitytoday.com/feed/", status: "ok" as const, lean: "Evangelical" },
  { name: "The Gospel Coalition", state: "US", feed: "thegospelcoalition.org/feed/", status: "ok" as const, lean: "Reformed evangelical" },
  { name: "Al Islam", state: "Global", feed: "alislam.org/feed/", status: "ok" as const, lean: "Ahmadiyya Muslim" },
  { name: "World Council of Churches", state: "Global", feed: "oikoumene.org/rss.xml", status: "ok" as const, lean: "Ecumenical Christian" },
  { name: "Jerusalem Post", state: "Israel", feed: "jpost.com/rss/rssfeedsheadlines.aspx", status: "ok" as const, lean: "Right-Center, Jewish" },
];

/* ── Layer 5: Public Opinion ── */

const publicOpinionDirect = [
  { name: "Pew Research Center", state: "US + Global", feed: "pewresearch.org/feed/", status: "ok" as const, lean: "Nonpartisan" },
  { name: "Ipsos", state: "Global", feed: "ipsos.com/en/rss.xml", status: "ok" as const, lean: "Nonpartisan" },
  { name: "RealClearPolitics", state: "US", feed: "realclearpolitics.com/index.xml", status: "ok" as const, lean: "Right-Center aggregator" },
  { name: "FiveThirtyEight", state: "US", feed: "fivethirtyeight.com/feed/", status: "ok" as const, lean: "Center, data-driven" },
  { name: "Monmouth University", state: "US", feed: "monmouth.edu/polling-institute/feed/", status: "ok" as const, lean: "Nonpartisan, A+ rated" },
  { name: "Rasmussen Reports", state: "US", feed: "rasmussenreports.com/rss", status: "ok" as const, lean: "Right" },
  { name: "Afrobarometer", state: "40 African countries", feed: "afrobarometer.org/feed/", status: "ok" as const, lean: "Nonpartisan" },
  { name: "Arab Barometer", state: "Arab world", feed: "arabbarometer.org/feed/", status: "ok" as const, lean: "Nonpartisan" },
];

const publicOpinionGoogleNews = [
  { name: "Gallup", state: "US + Global", feed: "news.google.com/rss/search?q=Gallup+poll", status: "ok" as const, lean: "Nonpartisan" },
  { name: "YouGov", state: "US + UK + Global", feed: "news.google.com/rss/search?q=YouGov+poll", status: "ok" as const, lean: "Nonpartisan" },
  { name: "Morning Consult", state: "US", feed: "news.google.com/rss/search?q=Morning+Consult+poll", status: "ok" as const, lean: "Nonpartisan" },
  { name: "Quinnipiac University", state: "US", feed: "news.google.com/rss/search?q=Quinnipiac+poll", status: "ok" as const, lean: "Nonpartisan, A+ rated" },
  { name: "PRRI", state: "US", feed: "news.google.com/rss/search?q=PRRI+survey", status: "ok" as const, lean: "Nonpartisan, religion" },
  { name: "NORC / AP-NORC", state: "US", feed: "news.google.com/rss/search?q=NORC+poll", status: "ok" as const, lean: "Nonpartisan, A+ rated" },
  { name: "Marist College", state: "US", feed: "news.google.com/rss/search?q=Marist+poll", status: "ok" as const, lean: "Nonpartisan, A+ rated" },
  { name: "Siena College", state: "US (NYT/Siena)", feed: "news.google.com/rss/search?q=Siena+College+poll", status: "ok" as const, lean: "Nonpartisan, A+ rated" },
  { name: "Emerson College", state: "US", feed: "news.google.com/rss/search?q=Emerson+College+poll", status: "ok" as const, lean: "Nonpartisan" },
  { name: "Data for Progress", state: "US", feed: "news.google.com/rss/search?q=Data+for+Progress+poll", status: "ok" as const, lean: "Left-leaning" },
  { name: "Eurobarometer", state: "EU (27 countries)", feed: "news.google.com/rss/search?q=Eurobarometer+survey", status: "ok" as const, lean: "Nonpartisan, EU official" },
  { name: "Edelman Trust", state: "Global (28 countries)", feed: "news.google.com/rss/search?q=Edelman+Trust+Barometer", status: "ok" as const, lean: "Corporate trust index" },
];

/* ── Components ── */

function FeedTable({ title, badge, badgeColor, feeds }: {
  title: string;
  badge: string;
  badgeColor: "green" | "amber" | "rose";
  feeds: { name: string; state: string; feed: string; status: "ok" | "broken" | "untested"; lean?: string }[];
}) {
  const colors = {
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
  const hasLean = feeds.some(f => f.lean);
  const leanColor = (lean?: string) => {
    if (!lean) return "text-zinc-400";
    if (lean.includes("Right")) return "text-rose-500";
    if (lean.includes("Left")) return "text-blue-500";
    return "text-zinc-500 dark:text-zinc-300";
  };
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[badgeColor]}`}>{badge}</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {feeds.map((f, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3 text-sm bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              f.status === "ok" ? "bg-green-500" :
              f.status === "broken" ? "bg-rose-500" :
              "bg-zinc-300 dark:bg-zinc-600"
            }`} />
            <span className="font-medium w-48 flex-shrink-0">{f.name}</span>
            <span className="text-zinc-400 w-20 flex-shrink-0 text-xs">{f.state}</span>
            {hasLean && <span className={`w-36 flex-shrink-0 text-xs font-medium ${leanColor(f.lean)}`}>{f.lean || "—"}</span>}
            <code className="text-xs text-zinc-400 truncate">{f.feed}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseStudyItem({ source, headline, detail }: { source: string; headline: string; detail: string }) {
  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
      <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">{source}</p>
      <p className="text-sm font-semibold mb-1">&ldquo;{headline}&rdquo;</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{detail}</p>
    </div>
  );
}
