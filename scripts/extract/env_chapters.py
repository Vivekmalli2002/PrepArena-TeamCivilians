"""
Files every Environmental Science question under the PCB AEE Paper-II / consolidated syllabus (10 units, numbered chapters).

Reads the built bank (public/data/q/env/*.json: run `node scripts/prepare-content.mjs` first), scores each question's text against the
chapter keyword lists below, and writes data/env-topics.json (question id -> [chapter, unit]). scripts/prepare-content.mjs applies it.
Its text decides the chapter; the old topic only breaks ties towards the unit it already belonged to. Re-run after adding
questions (e.g. a new book) and after editing the lists.
"""
import collections, json, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parents[2]

# (unit, chapter, regex). Chapter names carry "unit.chapter" so they sort in syllabus order inside the unit.
C = [
 (1, "1.1 Ecology basics: components & types of ecosystem", r"ecological|environment refers|environment modified|ecological imbalance|\bspeciation|\bcommunit(?:y|ies)|\blichen|symbio|\bmycorrhiz|\bmutualism|\bcommensal|\bparasit|\bpredat|\bcompetition|\bamensal|\bprotocooperation|\bbiomass|\becosphere|\bbiosphere\b|\blithosphere|\bhydrosphere|\batmosphere\b|\becolog|ecosystem\b|abiotic|\bbiotic|\bbiome|ecotone|\bniche|habitat|\bautecolog|synecolog|\bterrestrial\b|limiting factor|law of tolerance|\bshelford|\bliebig|ecological indicator|\bpopulation (?:density|growth|ecology|dynamic|interaction)"),
 (1, "1.2 Producers, consumers, decomposers, food chains & food webs", r"producer|consumer|decompos|\bdetritus|detritivore|\bsaprophyt|food chain|food web|trophic|autotroph|heterotroph|herbivore|carnivore|omnivore|scavenger|primary productiv|\bgpp\b|\bnpp\b|biomass"),
 (1, "1.3 Energy flow & ecological pyramids", r"10 ?(?:%|per ?cent|percent) law|energy (?:transfer|pass)|energy flow|pyramid|10 ?% law|ten percent|lindeman|\bgross\b.*productivity|ecological efficiency|energy transfer|ecological energetic"),
 (1, "1.4 Ecological succession", r"sequence of communities|successively|community change|\bsuccessional|succession|\bhydrarch|\bxerarch|\bsere\b|\bpioneer|climax|\bseral|\blithosere|\bpsammosere|\bhalosere"),
 (1, "1.5 Forest, grassland, desert & aquatic ecosystems", r"evergreen|deciduous|equatorial|rain ?forest|tropical forest|temperate forest|coniferous|\balpine|\bmontane|\bshola|\bvegetation|\bsavannah|\bmesophyt|\bxerophyt|\bhydrophyt|\bhalophyt|transitional (?:area|zone)|\becotone|\becocline|edge effect|grassland|\bdesert|\btundra|\btaiga|\bsavann|\bpond ecosystem|\blake ecosystem|aquatic ecosystem|marine ecosystem|estuar|\bmangrove ecosystem|\bcoral reef|\bphytoplankton|\bzooplankton|\bplankton|\bbenthos|\bnekton|\bneuston|forest ecosystem|\blentic|\blotic|\bthermocline|\bepilimnion|\bhypolimnion"),
 (1, "1.6 Biogeochemical cycles", r"biogeochemical|nitrogen cycle|carbon cycle|phosphorus cycle|sulphur cycle|sulfur cycle|nitrification|denitrification|nitrogen fixation|\bammonification|water cycle|hydrological cycle|oxygen cycle|\bsedimentary cycle|\bgaseous cycle|\brhizobium|\bazotobacter|\bcyanobacteria"),
 (1, "1.7 Bioaccumulation, biomagnification, ecosystem services & carrying capacity", r"bioaccumulat|biomagnif|bioconcentrat|ecosystem service|ecosystem value|carrying capacity|\bddt\b.*(?:food|magnif)|minamata|\bkeystone|ecological footprint.*capacity|\bmillennium ecosystem"),
 (1, "1.8 Population ecology & species interactions", r"survivorship|\bpopulation (?:size|parameter|growth|density|regulation|dynamic|interaction)|intrinsic rate|\bbirth rate|\bdeath rate|\bnatality|\bmortality|\bdispersal|\bimmigration|\bemigration|coexist|storage effect|\bcompetitive exclusion|\bgause|\blotka|\bvolterra|\br-?selected|\bk-?selected|\bmetapopulation|\blogistic|\bexponential|\bresource partition|\bspecies interaction|\bplant-animal|\bpollinat|\bspeciation|\bendemic"),
 (2, "2.1 Biodiversity: levels, values & mega-diversity", r"biodiversity|biological diversity|genetic diversity|species diversity|ecosystem diversity|alpha diversity|beta diversity|gamma diversity|mega-?diver|bio-?geographic|biogeographical|bio-?geographical zone|value of biodiversity|consumptive use|productive use|\boption value|species richness|\bendemism"),
 (2, "2.2 Hotspots, endemic & endangered species", r"hot ?spot|\bendemic|endangered|critically|\bvulnerable|red data|red list|\biucn|extinct|threatened species|\bendemic species|flagship|umbrella species|keystone species|rare species|\bnear threatened"),
 (2, "2.3 Threats to biodiversity: habitat loss, poaching, man–wildlife conflict, invasive species", r"habitat (?:loss|fragmentation|destruction)|poaching|man-?wildlife|human-?wildlife|\binvasive|alien species|exotic species|\bthreats? to biodiversity|loss of biodiversity|biodiversity loss|\bwater hyacinth|lantana|parthenium|\bfragmentation|sixth mass|mass extinction|\bdodo"),
 (2, "2.4 National parks & wildlife sanctuaries", r"national park|sanctuar|\bgir\b|kaziranga|corbett|\bnanda devi|\bmanas\b|\bperiyar|bandipur|nagarjunasagar|\bkolleru|\bpulicat|coringa|rollapadu|\bpapikonda|\bkeoladeo|ranthambore|\bbandhavgarh|\bkanha\b|\bsatpura|\bsimilipal|\bdachigam|\bhemis\b|\bsilent valley|protected area|\bcore zone|buffer zone|conservation reserve|community reserve|sacred grove|\bin-?situ|\bnaional park"),
 (2, "2.5 Biosphere reserves, Ramsar wetlands & world heritage sites", r"biosphere reserve|\bramsar|wetland|world heritage|\bunesco|man and biosphere|\bmab\b|\bnilgiri|\bsunderban|\bmanas biosphere|\bgulf of mannar|\bcold desert|\bpachmarhi|\bsimlipal|\bnokrek|\bagasthyamalai|\bpanna\b|\bkanchenjunga|\bdihang|\bachanakmar|\bmontreux|\bwetlands? of international"),
 (2, "2.6 Project Tiger, Project Elephant & species-recovery programmes", r"project tiger|tiger reserve|elephant reserve|project elephant|\bntca\b|crocodile (?:project|conservation)|\bgharial|\bsnow leopard|\bgreat indian bustard|\bvulture|\bblack ?buck|\bolive ridley|\bsea turtle|\bdolphin|\brhino|\blion (?:project|conservation)|\bpugmark|\bpugmarks|\bcensus of (?:tiger|lion|elephant)|\bwildlife (?:crime|trade|trafficking)|\bspecies recovery|\bproject cheetah|\bcheetah|\bpoach"),
 (2, "2.7 Ex-situ conservation: zoos, gene banks & botanical gardens", r"ex-?situ|\bzoo\b|\bzoos\b|\bzoological park|gene bank|seed bank|botanical garden|cryo-?preserv|\bgermplasm|captive breeding|arboretum|tissue culture bank|\bnbpgr"),
 (2, "2.8 Biodiversity laws & conventions: CBD, Biological Diversity Act, CITES", r"biological diversity act|biodiversity act|\bcbd\b|convention on biological|\bnagoya|cartagena|\bcites\b|kunming|30 ?x ?30|aichi|\bnbsap|national biodiversity authority|\bnba\b|biodiversity management committee|\bbmc\b|access and benefit|\bdigital sequence|\bipbes"),
 (3, "3.1 Forest resources: deforestation, mining & dams", r"deforest|afforest|reforest|forest resource|forest cover|timber|\bmining|dams?\b.*(?:forest|tribal|effect|impact)|\bcommunity forest|joint forest|social forestry|agro-?forestry|state of forest|\bchipko|\bappiko|\bforest policy|\bfsi\b|shifting cultivation|\bjhum|\bforest area|\bfire.*forest|forest fire"),
 (3, "3.2 Water resources: use, conservation & conflicts", r"water resource|\bgroundwater|ground water|\baquifer|water table|water scarcity|water stress|inter-?state water|water dispute|tribunal.*water|\bdesalin|\bwater use|overuse|irrigation.*(?:effect|problem)|virtual water|\bjal shakti|\bjal jeevan|\bnamami|atal bhujal|water footprint"),
 (3, "3.3 Mineral, land & soil resources: erosion, desertification, wasteland", r"mineral resource|\bland resource|soil erosion|\berosion\b|desertification|land degradation|\bwasteland|waste land|\blandslide.*(?:man|cause)|\bsoil conservation|\bsoil degradation|soil (?:profile|formation|horizon)|\bcontour (?:bund|farm)|\bterracing|\bgullies|ravine|\bsalinity|\balkalinity.*soil|\bwaterlogging|\bunccd|land use"),
 (3, "3.4 Food resources & agriculture: agro-chemicals, green revolution, organic farming", r"food resource|food problem|food security|green revolution|organic farming|\bfertili[sz]er|\bpesticide|\binsecticide|\bherbicide|\bipm\b|integrated pest|biofertili[sz]|\bmonoculture|\boverlgrazing|\bovergrazing|modern agricultur|\bzero budget|natural farming|\bbiopesticide|crop (?:rotation|residue)|stubble|\bhybrid (?:seed|variet)|\bbt cotton"),
 (3, "3.5 Non-renewable energy: coal, petroleum, natural gas & nuclear", r"\bcoal\b|petroleum|crude oil|natural gas|\blpg\b|\bcng\b|\bfossil|nuclear (?:energy|power|reactor|fission|fusion)|\buranium|\bthorium|fast breeder|\btarapur|\bkudankulam|\bnpcil|radioactive|reactor\b|calorific|oil refin|\bshale|methane hydrate|\bcoal bed|lignite|anthracite|bituminous|\bpeat"),
 (3, "3.6 Renewable energy: solar, wind, hydro, biomass, geothermal, tidal, hydrogen", r"renewable|\bsolar|photovoltaic|\bwind (?:energy|power|turbine|farm|mill)|wind\b.*energy|hydro-?(?:electric|power)|\bbiomass|\bbiogas|\bgeothermal|tidal|\bwave energy|\bocean thermal|\botec\b|green hydrogen|\bhydrogen (?:fuel|energy|economy)|fuel cell|non-?conventional|\bgobar|\bbio-?gas|\bbiodiesel|\bethanol blend|\bgasifier|\bsmall hydro"),
 (3, "3.7 Energy policy & schemes in India: capacity, biofuels, Bharat Stage norms", r"installed capacity|energy policy|national energy|policy on biofuels|\bbharat stage|\bbs-?(?:iv|vi|6|4)\b|\bmnre|\bkusum|surya ghar|\bpm-?kusum|\bnational solar mission|\bsolar park|\bujala|\bgreen hydrogen mission|\bsatat|energy conservation|\bbee\b|bureau of energy|energy efficiency|\bperform,? achieve|\bpat scheme|star label|\becbc|\bcapacity addition|\bgigawatt|\bgw\b|\bmw\b"),
 (4, "4.1 Air pollution: pollutants, sources & effects", r"\bdust\b|\bsmoke|fine particle|micro-?meters?|\bpm sampler|\bso ?2\b|air freshener|\bcigarette|\btobacco|\blung|\binhal|\bimpurit|\bcontaminant|\bpollutant|\bgaseous|air pollut|primary pollutant|secondary pollutant|\bsmog|photochemical|particulate|\bpm ?2\.5|\bpm ?10|\bspm\b|\bsox\b|\bnox\b|\bsulphur dioxide|sulfur dioxide|nitrogen oxide|carbon monoxide|\bco\b.*(?:haemoglobin|poison)|\bpan\b|peroxyacetyl|\bvoc\b|volatile organic|\bozone.*(?:ground|troposph)|\bindoor air|\bfly ash|\bsoot|\baerosol|\bmethyl isocyanate|\blead.*(?:petrol|gasoline)|\bautomobile|vehicular|exhaust|tailpipe|catalytic converter|\bnatural sources of air"),
 (4, "4.2 Air quality standards, indices & monitoring (NAAQS, AQI)", r"\bnaaqs|air quality (?:standard|index|monitor)|\baqi\b|\bsafar\b|\bnamp\b|\bhi-?vol|high volume sampler|ambient air|\bnational clean air|\bncap\b|stack monitoring|emission standard|\bgraded response|\bgrap\b|\bpuc\b|pollution under control"),
 (4, "4.3 Air pollution control technologies: ESP, scrubbers, cyclones, baghouse", r"electrostatic|\besp\b|scrubber|cyclone separator|\bcyclone\b.*(?:separator|dust|collector)|bag ?house|bag filter|fabric filter|settling chamber|venturi|gravity settler|dust collector|\bfgd\b|flue gas|\bscr\b|\bsnc?r\b|adsorption|absorption tower|packed tower|\bafterburner|\bbiofilter|\bcollection efficiency|control equipment|control device|\bstack height|\bchimney|\bmaximum.*stack"),
 (4, "4.4 Atmospheric dispersion & meteorology: plumes, lapse rates, inversion", r"\bplume|lapse rate|inversion|mixing height|stack|gaussian|dispersion|\bstability class|pasquill|\bneutral stratification|looping|coning|fanning|lofting|fumigation|trapping|atmospheric stability|adiabatic|\bwind rose|\bfunnel|dry adiabatic|\bsuperadiabatic|\bsubadiabatic|\bmeteorolog"),
 (4, "4.5 Water pollution: sources, characteristics & parameters (BOD, COD, DO)", r"water pollut|\bbod\b|\bcod\b|dissolved oxygen|\bdo sag|oxygen sag|deoxygenation|reaeration|biochemical oxygen|chemical oxygen|eutrophic|algal bloom|\bnutrient|\bnitrate|\bphosphate|thermal pollut|marine pollut|oil spill|\bturbidity|\bhardness|total dissolved|\btds\b|\bph of|alkalinity|\bsurface water|\bself-?purification|\bstreeter|\bcoliform|\bpathogen.*water|water-?borne|\bfluoride|\barsenic|\bheavy metal|\bmercury|\bcadmium|\bchromium|\bgroundwater contam"),
 (4, "4.6 Drinking water standards & water treatment", r"drinking water|potable|\bbis ?10500|\bwho standard|coagulat|flocculat|\balum\b|\bsedimentation|\bfiltration|\bsand filter|\bdisinfect|chlorinat|\bchlorine|\bozonation|\buv\b|\bultraviolet|water treatment|\bsoftening|\blime-?soda|\bzeolite|\bion exchange|\breverse osmosis|\bro\b|\bmembrane|\bdemineral|\baeration|\bwater supply|\bdesalination|\bresidual chlorine|\bbreakpoint|\bjar test"),
 (4, "4.7 Wastewater treatment: ASP, trickling filters, oxidation ponds, septic tanks, sludge", r"waste ?water|sewage|sewer|\bgrit chamber|primary (?:settling|treatment|clarifier)|secondary treatment|tertiary treatment|activated sludge|\basp\b|trickling filter|oxidation pond|lagoon|septic tank|imhoff|\bsludge|\bsvi\b|\bmlss\b|\bmlvss\b|\bsbr\b|\buasb\b|anaerobic digest|\bdigester|\bsettling tank|\bclarifier|\beffluent|\betp\b|\bstp\b|\bcetp\b|\bwetland.*treat|\breed bed|\brotating biological|\bsedimentation tank|\bscreen(?:s|ing)|\bcomminutor|constructed wetland|\bzero liquid"),
 (4, "4.8 Soil, marine, thermal & nuclear pollution", r"soil pollut|soil contamin|marine pollut|\bocean pollut|oil spill|\bthermal pollut|nuclear (?:pollut|hazard|accident|waste)|\bradiation (?:pollut|hazard)|\bradioactive (?:pollut|fallout)|\bchernobyl|\bfukushima|\bthree mile|\bmicroplastic|\bplastic pollut|\bpollution of soil|\bacidification of soil|\bpesticide residue"),
 (4, "4.9 Noise pollution", r"\bnoise|decibel|\bdb\b|\bsound level|\bhearing loss|\bdba\b|\bleq\b|\bsilence zone|\bnoise standard|\bloudness|\bultrasonic"),
 (4, "4.10 Bioremediation, transgenics & eco-friendly technologies", r"bioremediation|\bphytoremediation|\bmycoremediation|\bbioaugment|\bbiostimul|\bbio-?venting|\bbiosparging|\bland farming|\bcomposting.*remed|\btransgenic|\bgm crop|genetically modified|\bgeac\b|\bbt brinjal|\bbt cotton|\bbiopesticide|\beco-?friendly|\bin-?situ remed|\bex-?situ remed|\bpseudomonas|\boil.?zapper|\bbiosurfactant"),
 (5, "5.1 Municipal solid waste: sources, composition, collection & transport", r"municipal solid|\bmsw\b|solid waste|garbage|refuse|\bwaste generation|waste composition|collection (?:of|system)|segregat|transfer station|haul(?:ed)? container|stationary container|\bwaste characteris|per capita waste|\bswm\b|\bswachh|\bsource separation|\bwaste collection|\bhauled|\bwaste quantity|\bmoisture content of"),
 (5, "5.2 Solid waste processing & disposal: composting, landfill, incineration, 3Rs", r"\bcompost|vermi|landfill|incinerat|\bpyrolysis|gasification|\brdf\b|refuse derived|waste to energy|waste-to-energy|\bleachate|landfill gas|\bsanitary landfill|\bdump(?:ing|site)|\b3 ?rs\b|reduce,? reuse|\brecycl|\bpelletiz|\bwindrow|\banaerobic digestion.*(?:solid|msw)|\bbiomethan"),
 (5, "5.3 Industrial & hazardous waste management", r"hazardous waste|industrial waste|\btsdf\b|\bmanifest|\bsecure landfill|\bsolidification|\bstabili[sz]ation|\bcharacteri[sz]ation of hazard|\bflammab|\bcorrosiv|\breactiv|\btoxicity characteristic|\btclp|\bcement kiln|co-?process|\btreatment storage and disposal|\bwaste exchange|\bwaste minimi[sz]|\bcleaner production|\bwaste audit|\bzero waste|\bfly ash utili|\bred mud|\bphosphogypsum"),
 (5, "5.4 E-waste, biomedical & plastic waste", r"e-?waste|electronic waste|\bweee\b|bio-?medical|biomedical|\bhospital waste|\bsharps|\bcolou?r.?cod|yellow bag|red bag|\bplastic waste|plastic|\bpolythene|\bepr\b|extended producer|\bsingle use|\bbattery waste|\bbattery|\bcrt\b|\bprinted circuit|\bpcb\b.*waste|\bcell phone|mobile phone|\btetra pak"),
 (6, "6.1 Greenhouse gases, global warming & climate change", r"greenhouse|global warming|climate change|\bgwp\b|global warming potential|\bcarbon dioxide|\bco2\b|\bmethane|\bn2o\b|nitrous oxide|\bsf6\b|\bhfc|\bpfc|radiative forcing|\bipcc|\bcarbon (?:footprint|sink|credit|neutral|tax|trading|capture|sequestration)|\bnet.?zero|\bnet zero|\bsea level|\bglacier|\bmelting|temperature rise|\bclimate (?:justice|resilien|adaptation|mitigation)|\bel ?nino|\bla ?nina|\bcarbon budget|\bcarbon market"),
 (6, "6.2 Ozone depletion & ozone-depleting substances", r"\bphytotron|\bozone|\bodp\b|\bods\b|\bcfc|\bhcfc|chlorofluorocarbon|halon|\bhalons|methyl bromide|carbon tetrachloride|montreal protocol|\bkigali|\bvienna convention|stratosph|\buv-?b|\bdobson|ozone hole|\bantarctic.*ozone|\brefrigerant|\bfreon"),
 (6, "6.3 Acid rain", r"acid rain|acid deposition|\bacid precip|\bph of rain|\bsulphuric acid.*rain|\bnitric acid.*rain|\btaj mahal|\bmathura refinery|\bmarble cancer|\bforest dieback|\bacidif"),
 (6, "6.4 Ocean acidification, deforestation, desertification & other global problems", r"ocean acidification|coral bleaching|\bdeforestation.*global|\bdesertification|\bnuclear holocaust|\bnuclear winter|\bholocaust|\bconsumerism|\bwasteland reclam|\bglobal environmental (?:issue|problem)|\bpopulation explosion.*environ|\bmajor environmental|\btransboundary|\bhaze\b|\bglobal dimming|\bmethane emission.*(?:paddy|livestock)|\bpermafrost|\btipping point"),
 (7, "7.1 Environment (Protection) Act 1986 & core Indian environmental laws", r"environment \(?protection\)? act|\bep act|\bepa\b|\bair \(?prevention|\bwater \(?prevention|\bforest \(?conservation|\bwild ?life \(?protection|wildlife protection act|forest rights act|national green tribunal act|\bngt act|\bact,? 19(?:72|74|80|81|86|95)\b|\bact of 19(?:72|74|80|81|86)|\bpublic liability insurance|\bschedule (?:i|ii|iii|iv|v|vi)\b.*wild|\bsection \d+.*act|\bcpcb\b.*power|\bconsent to (?:establish|operate)|\bcte\b|\bcto\b|enforcement|\bpenalt|\bcrz\b|coastal regulation|\bgazette|\bnotification.*environment|\bforest act|\bindian forest act|\bsc\b.*(?:judg|case)|\bm\.?c\.? mehta|\bsupreme court.*environ"),
 (7, "7.2 Waste management rules: MSW, bio-medical, hazardous, e-waste & plastic", r"\brules,? ?(?:19|20)\d\d|\bmswm? rules|solid waste management rules|bio-?medical waste management rules|hazardous (?:and other )?wastes? \(?management|e-waste \(?management rules|plastic waste management rules|battery management rules|\bconstruction and demolition|\bc ?& ?d waste|\bbmw rules|\bswm rules|\bmanifest system|\bform \d|\bauthori[sz]ation under"),
 (7, "7.3 International conventions, protocols & summits", r"rio ?\+ ?20|earth summit|\brio\b|stockholm|\bkyoto|montreal protocol|paris (?:agreement|convention|accord)|\bunfccc|\bcop ?\d+|\bcop\b|\bbasel|\brotterdam|\bstockholm convention|\bminamata|\bramsar convention|world heritage convention|\bcbd\b|\bcites\b|\bunep\b|\bun environment|\bagenda 21|\bbrundtland|\bbonn|\bdoha|\bcancun|\bcopenhagen|\bmarrakesh|\bglasgow|\bsharm|\bdubai|\bbaku|\bparis agreement|\bdurban|\bmontreal|\bvienna|\bnagoya|\bcartagena|\bunccd|\bunclos|\bmarpol|\binternational solar alliance|\bisa\b|\bmission life|\blife mission|\bglobal environment facility|\bgef\b|\bgreen climate fund|\bipbes|\bwwf\b|\bgreenpeace|\bunesco"),
 (7, "7.4 Environmental policies, authorities & institutions", r"environment policy|national environment policy|\bnep\b|\bmoefcc?\b|ministry of environment|\bcpcb\b|\bspcb\b|\bpcb\b.*(?:board|state|central)|central pollution control board|state pollution control board|national green tribunal|\bngt\b|\bnbwl\b|\bnca\b|\bnational ganga|\bnmcg\b|\bnational wildlife|\bnational forest policy|\bwildlife institute|\bwii\b|\bbsi\b|\bzsi\b|\bicfre\b|\bfsi\b|\bgeac\b|\bnational action plan|\bnapcc|\bnational mission|\bgreen india|\bnational afforestation|\bcampa\b|\bnational clean energy|\bpolicy|\bpublic interest litigation|\bpil\b|\bpolluter pays|\bprecautionary principle|\bsustainable development principle|\binstitution|\bcommittee|\bcommission|\bauthority|\btribunal"),
 (8, "8.1 Environmental impact assessment (EIA): process, baseline data, impacts, EMP", r"\beia\b|environmental impact assessment|environment impact assessment|\bscreening|\bscoping|\bbaseline|\bemp\b|environmental management plan|\bpublic hearing|\bterms of reference|\btor\b|\bleopold|\bmatrix|\bchecklist|\bnetwork method|\boverlay|\bbattelle|\bcategory a\b|\bcategory b\b|\bseiaa\b|\bserc\b|\bsea\b|strategic environmental|\bprior environmental clearance|\bec ?clearance|\bforest clearance|\bimpact (?:prediction|identification|evaluation)|\bmitigation measure"),
 (8, "8.2 Environmental audit, risk assessment, LCA, ecological footprint & green buildings", r"ecological footprint|\bfootprint|environmental audit|\baudit\b|risk assessment|hazard identification|\blife cycle|\blca\b|\bcradle to|ecological footprint|carbon footprint|water footprint|green building|\bgriha\b|\bleed\b|\bigbc\b|\becomark|\bisp14000|\biso ?14001|\biso ?14000|\bgreen (?:rating|certification|product|procurement)|\bsustainability index|\benvironmental accounting|\bgreen gdp|\bgreen accounting|\bgreen audit|\bcleaner production"),
 (8, "8.3 Sustainable development, SDGs, environmental ethics & low-carbon lifestyle", r"sustainable development|\bsdg|\bsustainab|\bbrundtland|environmental ethic|\bconsumerism|\blow.carbon|\blifestyle|\bmission life|\benvironmental education|\bnitiaayog|\bniti aayog|\bsdg index|\bgreen economy|\bcircular economy|\bgreen growth|\bdeep ecology|\bgaia|\bshallow ecology|\bgandhi|\bschumacher|\bsmall is beautiful|\bagenda 2030|\b2030 agenda|\bmdg|millennium development|\binclusive|\bintergenerational|\bequity"),
 (8, "8.4 Water conservation, rainwater harvesting & watershed management", r"rain ?water harvest|\brwh\b|water conservation|watershed|\bcheck dam|\bpercolation tank|\bfarm pond|\bnala bund|\brecharge|\bmicro-?irrigation|\bdrip irrigation|\bsprinkler|\bneeru-?meeru|\bjalyukt|\bkhadin|\bbawdi|\bstep ?well|\bjohad|\btankas?\b|\bkul\b|\bzabo\b|\bkuhl|\bpani panchayat|\bwater harvesting|\bwatershed development|\bwdc\b|\biwmp\b|\bpmksy"),
 (8, "8.5 Resettlement & rehabilitation, environmental movements & urban problems", r"andolan|beej bachao|navdanya|\bsatyagraha|resettlement|rehabilitation|\br ?& ?r\b|displace|\bnarmada|\btehri|\bsardar sarovar|\bsilent valley|\bchipko|\bappiko|\bbishnoi|\bnavdanya|\bgreen belt movement|\bmendha|\bpani panchayat|environmental movement|\bplachimada|\burban (?:problem|sprawl|heat|flood|waste|energy|planning|environment)|\bcrazy consumer|\bslum|\bsprawl|\bsmart cit|\burbani[sz]ation|\bheat island|\bgreen belt|\burban forest|\btransport.*urban"),
 (9, "9.1 Human population growth, demography & family welfare", r"population (?:growth|explosion|curve|pyramid|census|density|policy|control|variation)|\bdemograph|\bbirth rate|\bdeath rate|\bfertility rate|\btfr\b|\bsex ratio|\bcensus|\bdemographic transition|\bfamily welfare|\bfamily planning|\bhuman development index|\bhdi\b|\bmalthus|\bgrowth rate|\bj-?shaped|\bs-?shaped|\bdoubling time|\bpopulation of india|\blife expectancy|\bmigration|\bage structure|\blogistic|\bexponential growth"),
 (9, "9.2 Environment & human health: diseases, toxicology, HIV/AIDS & pandemics", r"human health|\bdisease|\bhealth\b|toxic|\btoxicology|\bhiv\b|(?-i:\bAIDS\b)|\bcholera|\btyphoid|\bdysentery|\bjaundice|\bhepatitis|\bmalaria|\bdengue|\bchikungunya|\bfilaria|\bplague|\btuberculosis|\bcovid|\bpandemic|\bepidemic|\bswine flu|\bavian|\bzoonotic|\bbhopal|\bitai-?itai|\bminamata|\bfluorosis|\bmethaemoglobin|\bblue baby|\bblack foot|\bcarcinogen|\bmutagen|\bteratogen|\blethal dose|\bld ?50|\bnutrition|\bmalnutrition|\bantibiotic resistance|\bsanitation|\bhygiene|\bvaccin|(?-i:\bWHO\b)"),
 (9, "9.3 Human rights, value education, women & child welfare & role of IT", r"human rights|value education|\bwomen|\bchild(?:ren)?\b.*(?:welfare|labour|right)|\bwelfare programme|\bwelfare scheme|\binformation technology|\bgis\b|\bremote sensing|\bgps\b|\bit in environment|\bdatabase|\benvis\b|\bearth observation|\binternet|\bdigital|\be-?governance|\bicds\b|\bpoverty|\bgender|\bequality|\bsocial justice|\bnhrc\b|\bpublic awareness|\bawareness"),
 (10, "10.1 Natural disasters: floods, earthquakes, cyclones, landslides, tsunami & drought", r"\bflood|\bearthquake|seismic|\bmagnitude|\brichter|\bmercalli|epicen|\bfocus\b.*earthquake|\bcyclone|\bhurricane|\btyphoon|\bstorm surge|\blandslide|\bavalanche|\btsunami|\bdrought|\bcloud ?burst|\bheat ?wave|\bcold ?wave|\blightning|\bthunderstorm|\bvolcan|\bnatural disaster|\bnatural hazard|\bfault\b|\bplate tectonic|\bglof\b|\bglacial lake|\bwildfire|\bhazard zone|\bseismic zone|\bbis ?1893|\bimd\b|\bpost-?flood|\bflash flood"),
 (10, "10.2 Disaster management cycle: DM Act 2005, NDMA, Sendai Framework, preparedness & mitigation", r"disaster management|\bdm act|disaster management act|\bndma\b|\bsdma\b|\bndrf\b|\bsdrf\b|\bsendai|\bhyogo|\bvulnerab|\bpreparedness|\bmitigation|\brelief|\brehabilitation|\bresilien|\bearly warning|\bdisaster risk|\bdrr\b|\bnidm\b|\bcapacity building|\bcommunity based|\bfirst responder|\bevacuation|\bdisaster (?:cycle|response|recovery|prevention)|\bprevention and mitigation|\bpm.?s ?10 ?point|\bcdri\b|\bnational disaster"),
 (10, "10.3 Remote sensing & GIS in disasters; man-made & industrial disasters", r"remote sensing|\bgis\b|\bsatellite|\bman-?made disaster|\bmanmade|\bindustrial (?:disaster|accident|hazard)|\bbhopal|\bchernobyl|\bfukushima|\bvizag|\bgas leak|\bstyrene|\boil spill|\bchemical disaster|\bnuclear (?:disaster|accident)|\bfire (?:accident|safety|hazard)|\bstampede|\bterror|\bdam failure|\bbuilding collapse|\bmine (?:accident|disaster)|\btransport (?:accident|disaster)|\bnational crisis management"),
]
UNIT_FALLBACK = {1: "1.9 Ecosystem: other questions", 2: "2.9 Biodiversity: other questions", 3: "3.8 Natural resources & energy: other questions", 4: "4.11 Pollution & control: other questions",
                 5: "5.5 Solid & industrial waste: other questions", 6: "6.5 Climate & global issues: other questions", 7: "7.5 Policies, conventions & laws: other questions",
                 8: "8.6 EIA & sustainability: other questions", 9: "9.4 Population & health: other questions", 10: "10.4 Disaster management: other questions"}
MISC = "Environment: unclassified"
# A question's old topic (when it already carried a syllabus unit) nudges the score towards that unit.
PRIOR_BONUS = 1.5
BROAD = {"7.4 Environmental policies, authorities & institutions", "7.1 Environment (Protection) Act 1986 & core Indian environmental laws", "9.2 Environment & human health: diseases, toxicology, HIV/AIDS & pandemics",
         "9.3 Human rights, value education, women & child welfare & role of IT", "8.3 Sustainable development, SDGs, environmental ethics & low-carbon lifestyle", "3.7 Energy policy & schemes in India: capacity, biofuels, Bharat Stage norms",
         "3.2 Water resources: use, conservation & conflicts", "5.4 E-waste, biomedical & plastic waste", "1.1 Ecology basics: components & types of ecosystem", "7.3 International conventions, protocols & summits",
         "10.2 Disaster management cycle: DM Act 2005, NDMA, Sendai Framework, preparedness & mitigation", "6.1 Greenhouse gases, global warming & climate change", "4.1 Air pollution: pollutants, sources & effects",
         "4.5 Water pollution: sources, characteristics & parameters (BOD, COD, DO)", "2.4 National parks & wildlife sanctuaries", "2.5 Biosphere reserves, Ramsar wetlands & world heritage sites", "2.1 Biodiversity: levels, values & mega-diversity"}
RX = [(u, n, re.compile(r, re.I)) for u, n, r in C]
UNIT_OF_NAME = {n: u for u, n, _ in C} | {v: k for k, v in UNIT_FALLBACK.items()} | {}
UNIT_OF_NAME = {n: u for u, n, _ in C}
for u, n in UNIT_FALLBACK.items():
    UNIT_OF_NAME[n] = u

# The question's source topic -> syllabus unit, used only as a prior (snapshot of the topics the bank had before this regrouping).
PRIOR_UNIT = {
 "Ecology & Ecosystem": 1,
 "Air Pollution and Control (chemical engineering)": 1,
 "Ecosystem structure & functions": 1,
 "GATE ES: Microbiology & biochemistry": 1,
 "GATE ES: Nitrogen cycle & microbiology": 1,
 "Sanctuary / Biosphere Reserve": 2,
 "Biodiversity & Conservation": 2,
 "Forest": 2,
 "Water Pollution and Control (chemical engineering)": 2,
 "Biodiversity & biotic resources": 2,
 "Non-conventional Energy Sources": 3,
 "Coal & coalification": 3,
 "Natural resources & energy management": 3,
 "Noise Pollution (chemical engineering)": 3,
 "Hydropower & renewable energy": 3,
 "Nuclear energy & radiation": 3,
 "Petroleum & natural gas": 3,
 "Biofuels": 3,
 "Energy statistics (India)": 3,
 "Pollution": 4,
 "Environmental pollution & control technologies": 4,
 "Solid Waste: Hazards and Disposal (chemical engineering)": 4,
 "Air quality standards & pollutant types": 4,
 "Plume dispersion & meteorology": 4,
 "Nutrients & eutrophication": 4,
 "Water treatment: coagulation & disinfection": 4,
 "Particulate & gaseous control devices": 4,
 "Noise pollution": 4,
 "GATE ES: Air pollution": 4,
 "BOD, COD & oxygen demand": 4,
 "Water chemistry": 4,
 "Photochemical smog": 4,
 "GATE ES: Wastewater engineering": 4,
 "Contaminants & standards": 4,
 "Air pollution calculations": 4,
 "GATE ES: Environmental chemistry": 4,
 "Membrane processes": 4,
 "GATE ES: Water treatment": 4,
 "GATE ES: Noise pollution": 4,
 "Wastewater treatment": 4,
 "Solid, industrial & e-waste management": 5,
 "Pollution Control Equipment (chemical engineering)": 5,
 "GATE ES: Solid waste management": 5,
 "Anaerobic digestion & bioreactors": 5,
 "Climate Change & Green House Gases": 6,
 "Ozone Layer": 6,
 "Atmospheric chemistry & ozone": 6,
 "Greenhouse gases & climate": 6,
 "Environment Legislation & Conventions": 7,
 "Environmental policies, conventions & laws": 7,
 "Indian environmental legislation": 7,
 "International conventions & protocols": 7,
 "Environmental policy, principles & institutions": 7,
 "Environment Conservation": 8,
 "Sustainable Development": 8,
 "EIA, sustainability & social issues": 8,
 "EIA process & clearance": 8,
 "Environmental management tools & LCA": 8,
 "GATE ES: Sustainable development & LCA": 8,
 "Ecology basics: ecosystem, food chain & energy flow": 1,
 "Ecosystem (AEE practice bank)": 1,
 "Biodiversity, hotspots & species": 2,
 "Protected areas: national parks, sanctuaries & reserves": 2,
 "Forests, wildlife & conservation movements": 2,
 "Air, water, soil & noise pollution": 4,
 "Solid waste, e-waste & hazardous waste": 5,
 "Climate change, ozone & global warming": 6,
 "Energy: renewable & non-renewable": 3,
 "Environmental laws, policies & institutions": 7,
 "International conventions, treaties & organisations": 7,
 "Agriculture, sustainable development & resources": 3,
 "Biodiversity & conservation": 2,
 "Ecology & ecosystem": 1,
 "Pollution & waste": 4,
 "Climate change & energy": 6,
 "Laws, conventions & institutions": 7,
 "Environmental issues & disaster management": 10
}

def main():
    files = sorted((root / "public/data/q/env").glob("*.json"))
    qs = [q for f in files for q in json.loads(f.read_text("utf8"))]
    prior = PRIOR_UNIT
    out, cnt, other = {}, collections.Counter(), []
    for q in qs:
        # the chapter must not depend on the previous run's chapter, only on the text and the source's own topic
        t0 = q.get("srcTopic") or q["topic"]
        text_q = q["question"]; text_o = " ".join(q.get("options") or []); text_e = q.get("explanation") or ""
        best, best_s = None, 0.0
        for u, name, rx in RX:
            s = 2 * len(rx.findall(text_q)) + len(rx.findall(text_o)) + len(rx.findall(text_e))
            if name in BROAD: s *= 0.6
            if s and prior.get(t0) == u: s += PRIOR_BONUS
            if s > best_s + 1e-9: best, best_s = name, s
        if best_s < 1.2:
            u = prior.get(t0)
            best = UNIT_FALLBACK[u] if u else MISC
        out[q["id"]] = [best, UNIT_OF_NAME.get(best)]
        cnt[best] += 1
        if best.endswith("other questions") or best == MISC: other.append(q)
    (root / "data/env-topics.json").write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n", "utf8")
    print(f"{len(qs)} environment questions in {len(cnt)} chapters")
    for name in sorted(cnt, key=lambda n: (UNIT_OF_NAME.get(n, 99), [int(x) for x in re.findall(r"^\d+\.\d+", n)[0].split(".")] if re.match(r"^\d+\.\d+", n) else [99, 99])):
        print(f"{cnt[name]:5d}  {name}")
    print(f"{len(other)} left in 'other' buckets ({100*len(other)/len(qs):.1f}%)")
    return other

if __name__ == "__main__":
    other = main()
    if "--show-other" in sys.argv:
        for q in other[:40]: print("-", q["topic"], "|", q["question"][:110].replace("\n", " "))
